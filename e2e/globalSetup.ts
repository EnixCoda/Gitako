import { chromium, type BrowserContext, type Page, type Worker } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { setFeatureState, FeatureTabMissingError } from './featurePreview'
import { resolveProfilePath } from './fixtures'
import { knownFeaturePreviewItems, type FeaturePreviewKey } from './github-feature-preview'
import { sleep } from './utils'

// playwright.config only loads .env on arm64 darwin; load it here too so
// GITAKO_ACCESS_TOKEN is available wherever globalSetup runs (CI included).
dotenv.config()

const GITHUB_CONFIG_KEY = 'platform_github.com'

// Cap any single setup step so a service-worker/profile-lock hiccup can't
// wedge the whole run (a hung persistent context blocks every spec behind it).
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`globalSetup: ${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

// These run INSIDE the service worker (the only context with chrome.storage
// access); the `chrome` global is typed inline since the page-side TS config
// has no `chrome` types.
function readStoredToken(worker: Worker): Promise<string> {
  return worker.evaluate(async key => {
    const stored = await (
      globalThis as unknown as {
        chrome: {
          storage: { local: { get(k: string): Promise<Record<string, { accessToken?: string }>> } }
        }
      }
    ).chrome.storage.local.get(key)
    return stored[key]?.accessToken || ''
  }, GITHUB_CONFIG_KEY)
}

function writeStoredToken(worker: Worker, token: string): Promise<void> {
  return worker.evaluate(
    async ([key, accessToken]) => {
      const storage = (
        globalThis as unknown as {
          chrome: {
            storage: {
              local: {
                get(k: string): Promise<Record<string, Record<string, unknown>>>
                set(v: Record<string, unknown>): Promise<void>
              }
            }
          }
        }
      ).chrome.storage.local
      const stored = await storage.get(key)
      await storage.set({ [key]: { ...(stored[key] || {}), accessToken } })
    },
    [GITHUB_CONFIG_KEY, token] as const,
  )
}

// The MV3 service worker is registered at launch, but the FIRST evaluate after
// a fresh launch can hang while the worker is still activating — then, once it
// responds, every later evaluate is instant and reliable. So we retry with a
// short per-attempt cap, re-acquiring the worker handle each time (a stale
// handle to a not-yet-live worker is part of the problem), until one lands.
async function runInWorker<T>(
  context: BrowserContext,
  op: (worker: Worker) => Promise<T>,
  label: string,
): Promise<T> {
  // A stuck first evaluate (cold worker) blocks the channel, so further
  // attempts queue behind it and can't recover — keep the budget small and let
  // the caller degrade (the local detect path) rather than waste ~30s.
  let lastErr: Error | undefined
  for (let attempt = 1; attempt <= 3; attempt++) {
    let [worker] = context.serviceWorkers()
    if (!worker) {
      try {
        worker = await withTimeout(
          context.waitForEvent('serviceworker'),
          4000,
          'await serviceworker',
        )
      } catch (err) {
        lastErr = err as Error
        await sleep(1500)
        continue
      }
    }
    try {
      return await withTimeout(op(worker), 4000, `${label} attempt ${attempt}`)
    } catch (err) {
      lastErr = err as Error
      await sleep(1500) // let the worker finish waking, then re-acquire and retry
    }
  }
  throw lastErr ?? new Error(`${label}: exhausted retries`)
}

/**
 * Ensure Gitako holds a GitHub access token before the suite runs, so every
 * spec — and the Feature Preview ON/OFF matrix in particular — makes
 * AUTHENTICATED API calls. Without a token Gitako falls back to the anonymous
 * 60 req/hour ceiling; a full run exhausts that and the tree fetch fails,
 * blanking the file list (the 'disabled'/'error-due-to-auth' states render no
 * nodes) — flaky "node-item not found" failures unrelated to the code under
 * test. An authenticated token raises the ceiling to 5000/hour.
 *
 * Idempotent by design: we READ the profile's token first and skip the write
 * when one is already present (the normal case — the profile is provisioned via
 * maint.oauth-bootstrap). Only when it's missing do we write GITAKO_ACCESS_TOKEN
 * (.env) into chrome.storage via the service worker. Whether that token came
 * from OAuth or a PAT is irrelevant here — the goal is just "a token is set."
 *
 * Best-effort: if the worker is unreachable we warn and let the suite run on
 * whatever the profile already holds, rather than wedging every spec behind a
 * setup hang. Token-LESS specs (feature.oauth, maint.oauth-bootstrap) bring
 * their own fresh/cleared profiles, so this never disturbs them.
 */
async function ensureAccessToken(context: BrowserContext) {
  try {
    // Detect-first: if the profile already carries a token (the steady state —
    // provisioned once via maint.oauth-bootstrap), there's nothing to do.
    const existing = await runInWorker(context, readStoredToken, 'read token')
    if (existing) {
      console.log('[globalSetup] access token already present — skipping seed')
      return
    }

    const token = process.env.GITAKO_ACCESS_TOKEN
    if (!token) {
      console.warn(
        '[globalSetup] no token in profile and GITAKO_ACCESS_TOKEN unset — specs run anonymously (rate-limited)',
      )
      return
    }

    await runInWorker(context, w => writeStoredToken(w, token), 'write token')
    console.log('[globalSetup] seeded Gitako access token into the profile')
  } catch (err) {
    console.warn(`[globalSetup] could not ensure access token (${(err as Error).message})`)
  }
}

const REPO_PAGE = 'https://github.com/EnixCoda/Gitako/tree/develop'

async function revealAndOpenSettings(page: Page) {
  await page.locator('.gitako-toggle-show-button').hover()
  await sleep(300)
  if (await page.locator('.gitako-side-bar-body-wrapper.collapsed').count()) {
    await page.locator('.gitako-toggle-show-button').click({ force: true })
    await sleep(400)
  }
  await page.locator('.gitako-side-bar [aria-label="Settings"]').click()
  await sleep(600)
}

/**
 * Provision a FRESH access token by driving Gitako's real OAuth flow, in two
 * steps the caller asked for:
 *
 *   1. CLEAR the existing token via the Settings "Clear" button so OAuthWrapper
 *      will exchange the ?code and the "Create with OAuth" entry point renders.
 *   2. RUN OAuth: click the entry point → github.com/login/oauth/authorize
 *      (the profile's session approves it) → redirect back with ?code →
 *      OAuthWrapper exchanges it via gitako.enix.one → token saved.
 *
 * This makes a working OAuth round-trip AND a live token a HARD PRECONDITION:
 * any failure throws, which aborts globalSetup so NO specs run against a
 * half-provisioned profile. Failure modes that throw: the dist lacks the OAuth
 * client_id; GitHub demands the sudo gate ("Confirm access" / "Verify via
 * email") that can't be satisfied unattended; the redirect/exchange never
 * completes; or "Your token has been saved" never appears afterward.
 *
 * Everything here is UI-driven (clear and verify included) — it deliberately
 * avoids the service-worker storage evaluate, which can hang while the worker
 * is activating; a transient worker stall must not abort an otherwise-healthy
 * OAuth round-trip. Mirrors the proven maint.oauth-bootstrap flow.
 *
 * Note: step 1 destroys the existing token, so an abort here leaves the profile
 * token-less — that's intended (the run shouldn't proceed if OAuth is broken).
 * Re-provision interactively with `node e2e/scripts/oauth-bootstrap.mjs`.
 */
async function provisionTokenViaOAuth(context: BrowserContext) {
  const page = await context.newPage()
  try {
    await page.goto(REPO_PAGE)
    await sleep(2000)
    await revealAndOpenSettings(page)

    // Step 1 — clear any existing token via the UI. Scope to the Access Token
    // section so we never grab a keyboard-shortcut "Clear" button.
    const tokenSection = page.locator('.gitako-side-bar div:has(> h3:has-text("Access Token"))')
    const clearButton = tokenSection.locator('button', { hasText: 'Clear' })
    if (await clearButton.count()) {
      await clearButton.first().click()
      const confirm = tokenSection.locator('button', { hasText: 'Confirm' })
      await confirm.waitFor({ state: 'visible', timeout: 8000 })
      // Confirm counts down ~3s before it enables.
      for (let i = 0; i < 20 && (await confirm.isDisabled().catch(() => true)); i++)
        await sleep(500)
      await confirm.click()
      await sleep(1000)
    }

    // Step 2 — kick off OAuth (the entry point renders once no token is set).
    const oauthLink = page.locator('.gitako-side-bar a.link-button', {
      hasText: 'Create with OAuth',
    })
    await oauthLink.waitFor({ state: 'visible', timeout: 15000 })
    await Promise.all([
      page.waitForURL(/github\.com\/login\/oauth\/authorize/, { timeout: 20000 }),
      oauthLink.click(),
    ])

    const clientId = new URL(page.url()).searchParams.get('client_id')
    if (!clientId) {
      throw new Error(
        'OAuth client_id is empty — rebuild dist with GITHUB_OAUTH_CLIENT_ID set (yarn build with .env)',
      )
    }

    // The authorize endpoint server-redirects a few times before settling, and
    // GitHub may demand sudo either before the grant page or right after the
    // Authorize click — so poll for a terminal state and re-settle after click.
    const authorizeButton = page.locator(
      'button[name="authorize"][value="1"], button:has-text("Authorize")',
    )
    const settle = async (): Promise<'redirected' | 'sudo' | 'authorize' | 'unknown'> => {
      for (let i = 0; i < 25; i++) {
        if (/github\.com\/EnixCoda\/Gitako/.test(page.url())) return 'redirected'
        const probe = await page
          .evaluate(() => {
            const t = document.body?.innerText || ''
            return {
              sudo: /Confirm access|Verify via email/i.test(t),
              authorize: /\bAuthorize\b/.test(t) && /wants to access|owned and operated/i.test(t),
            }
          })
          .catch(() => ({ sudo: false, authorize: false }))
        if (probe.sudo) return 'sudo'
        if (
          probe.authorize &&
          (await authorizeButton
            .first()
            .isVisible()
            .catch(() => false))
        )
          return 'authorize'
        await sleep(1000)
      }
      return 'unknown'
    }

    const sudoError = () =>
      new Error(
        'OAuth sudo gate ("Confirm access" / "Verify via email") — cannot provision unattended; ' +
          'satisfy sudo in the profile once via `node e2e/scripts/oauth-bootstrap.mjs`, then re-run',
      )

    let state = await settle()
    if (state === 'sudo') throw sudoError()
    if (state === 'authorize') {
      await authorizeButton.first().waitFor({ state: 'visible', timeout: 10000 })
      await authorizeButton.first().click()
      state = await settle()
      if (state === 'sudo') throw sudoError()
    }

    await page.waitForURL(/github\.com\/EnixCoda\/Gitako/, { timeout: 30000 })
    await sleep(4000) // token exchange + chrome.storage write

    // Verify via the UI (not storage): re-open settings and wait for the
    // saved-token state. In float mode the outer container is hover-hidden, so
    // read its text content rather than asserting visibility.
    await revealAndOpenSettings(page)
    let saved = false
    for (let i = 0; i < 15; i++) {
      const text = await page
        .locator('.gitako-side-bar')
        .innerText()
        .catch(() => '')
      if (/Your token has been saved/.test(text)) {
        saved = true
        break
      }
      await sleep(1000)
    }
    if (!saved) {
      throw new Error('OAuth flow completed but "Your token has been saved" never appeared')
    }
    console.log('[globalSetup] provisioned a fresh access token via OAuth')
  } finally {
    await page.close().catch(() => {})
  }
}

/**
 * Drive the bot profile to a known Feature Preview state. Gated by env so
 * manual `yarn playwright test` runs aren't slowed by a 15s dialog walk —
 * the nightly runner sets `GITAKO_PREVIEW_TARGET=on|off` to force the floor.
 * The runner does two passes (on then off) so every spec is validated at both
 * extremes. Unset (or any value besides on/off) → skipped.
 */
async function normalizeFeaturePreview(context: BrowserContext) {
  const raw = process.env.GITAKO_PREVIEW_TARGET
  if (raw !== 'on' && raw !== 'off') return
  const target = raw

  const page = await context.newPage()
  await page.goto('https://github.com/EnixCoda/Gitako')
  await sleep(2500)
  const keys = Object.keys(knownFeaturePreviewItems) as FeaturePreviewKey[]
  const normalized: FeaturePreviewKey[] = []
  const skipped: FeaturePreviewKey[] = []
  for (const key of keys) {
    try {
      await setFeatureState(page, key, target)
      normalized.push(key)
    } catch (err) {
      // A tracker key the account no longer offers is benign drift — the
      // flag can't be set because it doesn't exist. Warn and keep going so
      // every still-present flag still gets normalized to the floor, and let
      // drift.github-feature-preview.spec.ts report the tracker mismatch (a
      // cryptic globalSetup abort previously hid that report for weeks).
      if (err instanceof FeatureTabMissingError) {
        skipped.push(key)
        console.warn(
          `[globalSetup] feature "${key}" no longer in Feature Preview dialog ` +
            `(GitHub likely retired/GA'd it for this account) — skipping; the ` +
            `drift spec will flag the tracker.`,
        )
        continue
      }
      // Anything real (dialog won't open, toggle won't flip) stays a hard failure.
      throw err
    }
  }
  if (skipped.length > 0) {
    console.warn(
      `[globalSetup] normalized ${normalized.length}/${keys.length} preview flags to ${target} ` +
        `(skipped ${skipped.length}: ${skipped.join(', ')})`,
    )
  } else {
    console.log(`[globalSetup] normalized ${normalized.length} preview flags to ${target}`)
  }
}

export default async function globalSetup() {
  const profile = resolveProfilePath()
  if (!profile || !fs.existsSync(profile)) {
    // No persistent profile — nothing to seed/normalize. Signed-in specs
    // self-skip; the token-less specs bring their own profiles.
    return
  }

  const EXTENSION_PATH = path.resolve(__dirname, '..', 'dist')
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: [
      `--no-sandbox`,
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  })
  try {
    // ┌──────────────────────────────────────────────────────────────────┐
    // │ WHY OAuth is gated to the 'off' pass — DO NOT "simplify" lightly. │
    // └──────────────────────────────────────────────────────────────────┘
    //
    // The goal: validate the real OAuth round-trip AND mint a fresh token
    // EXACTLY ONCE per nightly, before any spec runs — not once per pass.
    //
    // It works only because of three invariants OWNED BY THE NIGHTLY RUNNER
    // (run.sh in the separate gitako-e2e repo — NOT visible from this repo):
    //
    //   1. The runner does two passes via `PASSES=("off" "on")`, each its own
    //      `GITAKO_PREVIEW_TARGET=<pass> yarn playwright test` invocation — so
    //      globalSetup (this function) runs once PER PASS.
    //   2. 'off' ALWAYS runs first.
    //   3. Both passes use the SAME persistent profile (run.sh keeps the
    //      profile path stable), so a token minted in the 'off' pass is still
    //      in chrome.storage when the 'on' pass starts.
    //
    // Given those, provisioning on 'off' only ⇒ OAuth runs once; the 'on'
    // pass just reuses the token (the `else` branch detects it present).
    //
    // ⚠️ If you change this condition (e.g. to also fire on 'on', or to
    // `GITAKO_PREVIEW_TARGET set`), OAuth runs TWICE per nightly again —
    // doubling round-trips, sudo-gate exposure, and token churn. If the
    // runner's pass ORDER or its shared-profile invariant ever changes, this
    // gate silently breaks (OAuth never runs, or runs after the 'on' pass has
    // already tested unauthenticated). Keep this in sync with run.sh.
    //
    // On 'off': clear + OAuth as a HARD PRECONDITION — any failure throws,
    // aborting the whole run, so no spec runs against a half-provisioned
    // profile. Every other case (the 'on' pass, the runner's non-matrix
    // 'default' pass, and local single-spec runs) takes the cheap,
    // non-destructive detect-or-seed path instead.
    if (process.env.GITAKO_PREVIEW_TARGET === 'off') {
      await provisionTokenViaOAuth(context)
    } else {
      await ensureAccessToken(context)
    }
    await normalizeFeaturePreview(context)
  } finally {
    await context.close()
  }
}
