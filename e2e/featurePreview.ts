import type { Page } from '@playwright/test'
import type { FeaturePreviewKey } from './github-feature-preview'
import { sleep } from './utils'

/**
 * Drive GitHub's per-user Feature Preview dialog programmatically:
 * read the current ON/OFF state of any feature and toggle it.
 *
 * State is server-side (persists across browser sessions), so every
 * caller MUST restore the previous state — `withFeatureState` does
 * this via try/finally and is the recommended entry point.
 *
 * Mechanism: the dialog uses an `<ul role="tablist">` of features.
 * Selecting a tab swaps the right pane to that feature's detail view,
 * which contains a Primer `ToggleSwitch` (a `<button>` with
 * `aria-pressed` reflecting state). We:
 *   1. Open the user-drawer dialog from the header avatar
 *   2. Click "Feature preview" inside it to launch the FP dialog
 *   3. Click the feature's tab (id ends with `-tab-<feature_key>`)
 *   4. Read / click the button.prc-ToggleSwitch-SwitchButton in the
 *      now-active tabpanel
 *   5. Close the dialog
 */

const FP_DIALOG = '[role="dialog"][data-component="Dialog"]'

/**
 * Thrown when the tracker knows a Feature Preview key but the signed-in
 * account no longer offers it in the dialog — i.e. GitHub retired / GA'd /
 * rolled it back for this user. This is benign tracker drift, NOT a runner
 * failure: the flag can't be set because it no longer exists, so callers
 * (notably `normalizeFeaturePreview` in globalSetup) warn and skip it rather
 * than aborting the run, and let `drift.github-feature-preview.spec.ts`
 * report the mismatch authoritatively.
 */
export class FeatureTabMissingError extends Error {
  constructor(key: FeaturePreviewKey) {
    super(`Feature tab "${key}" not found in dialog`)
    this.name = 'FeatureTabMissingError'
  }
}

async function openFeaturePreviewDialog(page: Page): Promise<void> {
  // If already open, no-op
  const alreadyOpen = await page.evaluate(sel => {
    const dialogs = Array.from(document.querySelectorAll(sel))
    return dialogs.some(d =>
      /^Feature Preview$/.test(d.querySelector('h1')?.textContent?.trim() ?? ''),
    )
  }, FP_DIALOG)
  if (alreadyOpen) return

  // Avatar drawer — use Playwright locator so pointer events reach React
  await page.locator('header button:has(img)').first().click()
  await sleep(700)

  // Feature preview entry within drawer. Find via DOM (text match across
  // the open drawer), then resolve to a stable locator and click.
  const fpEntryHandle = await page.evaluateHandle(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    const target = Array.from(dialog.querySelectorAll('a, button')).find(el =>
      /feature preview/i.test((el.textContent || '').trim()),
    )
    return target ?? null
  })
  const fpEntryEl = fpEntryHandle.asElement()
  if (!fpEntryEl) throw new Error('"Feature preview" entry not found in user drawer')
  await fpEntryEl.click()

  // Wait for the FP dialog content to load (it fetches async)
  for (let i = 0; i < 20; i++) {
    await sleep(400)
    const ready = await page.evaluate(sel => {
      const dialogs = Array.from(document.querySelectorAll(sel))
      const fp = dialogs.find(d =>
        /^Feature Preview$/.test(d.querySelector('h1')?.textContent?.trim() ?? ''),
      )
      return !!fp?.querySelector('[role="tablist"][aria-label="Feature Preview"] [role="tab"]')
    }, FP_DIALOG)
    if (ready) return
  }
  throw new Error('feature preview dialog did not finish loading within 8s')
}

async function selectFeatureTab(page: Page, key: FeaturePreviewKey): Promise<void> {
  // Find the tab id via DOM walk, then click via Playwright locator —
  // a synthetic .click() in page.evaluate doesn't trigger React's
  // tab-select handler reliably here, but locator.click does (it sends
  // proper pointer events).
  const tabId = await page.evaluate(featureKey => {
    const dialogs = Array.from(
      document.querySelectorAll('[role="dialog"][data-component="Dialog"]'),
    )
    const fp = dialogs.find(d =>
      /^Feature Preview$/.test(d.querySelector('h1')?.textContent?.trim() ?? ''),
    )
    if (!fp) return null
    const tab = Array.from(fp.querySelectorAll('[role="tablist"] [role="tab"]')).find(t =>
      t.id.endsWith(`-tab-${featureKey}`),
    )
    return tab?.id ?? null
  }, key)
  if (!tabId) throw new FeatureTabMissingError(key)
  // The id contains a `.` (Math.random()-style React-Aria ids); attribute
  // selector avoids parsing `.foo` as a class.
  await page.locator(`[id="${tabId}"]`).click()
  await sleep(400) // allow tabpanel swap
}

async function readToggleState(page: Page, key: FeaturePreviewKey): Promise<'on' | 'off'> {
  const state = await page.evaluate(featureKey => {
    const dialogs = Array.from(
      document.querySelectorAll('[role="dialog"][data-component="Dialog"]'),
    )
    const fp = dialogs.find(d =>
      /^Feature Preview$/.test(d.querySelector('h1')?.textContent?.trim() ?? ''),
    )
    if (!fp) return null
    const tab = Array.from(fp.querySelectorAll('[role="tablist"] [role="tab"]')).find(t =>
      t.id.endsWith(`-tab-${featureKey}`),
    )
    const panelId = tab?.getAttribute('aria-controls')
    const panel = panelId ? document.getElementById(panelId) : null
    if (!panel) return null
    const button =
      panel.querySelector('button[role][aria-pressed]') ||
      panel.querySelector('button[aria-pressed]') ||
      panel.querySelector('button.prc-ToggleSwitch-SwitchButton-1CtM6')
    if (!button) return null
    return button.getAttribute('aria-pressed') === 'true' ? 'on' : 'off'
  }, key)
  if (state === null) throw new Error(`Could not read toggle state for "${key}"`)
  return state
}

async function clickToggle(page: Page, key: FeaturePreviewKey): Promise<void> {
  // Resolve the toggle's id via DOM walk, then click via locator so the
  // pointer events reach React's onClick. The toggle is a single
  // <button> in the active feature's tabpanel.
  const panelId = await page.evaluate(featureKey => {
    const dialogs = Array.from(
      document.querySelectorAll('[role="dialog"][data-component="Dialog"]'),
    )
    const fp = dialogs.find(d =>
      /^Feature Preview$/.test(d.querySelector('h1')?.textContent?.trim() ?? ''),
    )
    if (!fp) return null
    const tab = Array.from(fp.querySelectorAll('[role="tablist"] [role="tab"]')).find(t =>
      t.id.endsWith(`-tab-${featureKey}`),
    )
    return tab?.getAttribute('aria-controls') ?? null
  }, key)
  if (!panelId) throw new Error(`Could not find tabpanel for "${key}"`)
  await page
    .locator(
      `[id="${panelId}"] button.prc-ToggleSwitch-SwitchButton-1CtM6, ` +
        `[id="${panelId}"] button[aria-pressed]`,
    )
    .first()
    .click()
  // Server-side commit; aria-pressed reflects new value only after the
  // POST resolves. Sleep slightly so callers can rely on readToggleState.
  await sleep(900)
}

async function closeFeaturePreviewDialog(page: Page): Promise<void> {
  // Click the FP dialog's explicit Close (X) button. Using Escape was
  // unreliable here — it sometimes left the user-drawer open in a
  // half-state where subsequent opens silently no-op'd.
  const closed = await page
    .locator('[role="dialog"][data-component="Dialog"] button[data-component="Dialog.CloseButton"]')
    .first()
    .click({ timeout: 2000 })
    .then(() => true)
    .catch(() => false)
  if (!closed) {
    // Fall back to Escape if the close button wasn't found
    await page.keyboard.press('Escape').catch(() => {})
  }
  await sleep(300)
  // Now close the user drawer if still open (Escape is the reliable way)
  const drawerStillOpen = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="dialog"]')).some(
      d => d.getAttribute('aria-labelledby') === 'global-nav-user-menu-header',
    ),
  )
  if (drawerStillOpen) {
    await page.keyboard.press('Escape').catch(() => {})
    await sleep(300)
  }
}

/**
 * Idempotently set the feature to the target state. No-op if already
 * there. Returns the previous state so callers can restore manually
 * if they're not using `withFeatureState`.
 */
export async function setFeatureState(
  page: Page,
  key: FeaturePreviewKey,
  target: 'on' | 'off',
): Promise<'on' | 'off'> {
  await openFeaturePreviewDialog(page)
  await selectFeatureTab(page, key)
  const previous = await readToggleState(page, key)
  if (previous !== target) {
    await clickToggle(page, key)
    // Verify by POLLING, not a single read. The click commits server-side and
    // `aria-pressed` only flips once that POST resolves; a single read can race
    // it and report the stale value — a false-negative that aborts the whole
    // nightly even though the toggle did flip (observed for command_palette).
    // Re-read for a few seconds; only if it never reaches target do we re-click
    // once (in case the click genuinely missed) and poll again before failing.
    let after = previous
    for (let attempt = 0; attempt < 2 && after !== target; attempt++) {
      if (attempt > 0) await clickToggle(page, key)
      for (let i = 0; i < 6; i++) {
        after = await readToggleState(page, key)
        if (after === target) break
        await sleep(500)
      }
    }
    if (after !== target) {
      throw new Error(`Failed to set "${key}" to ${target} — still reads ${after}`)
    }
  }
  await closeFeaturePreviewDialog(page)
  return previous
}

export async function getFeatureState(page: Page, key: FeaturePreviewKey): Promise<'on' | 'off'> {
  await openFeaturePreviewDialog(page)
  await selectFeatureTab(page, key)
  const state = await readToggleState(page, key)
  await closeFeaturePreviewDialog(page)
  return state
}

/**
 * Run `fn` with the feature in `target` state, then restore whatever
 * state the profile started in. Idempotent restore — if a previous
 * crashed run left the profile somewhere, this will still normalize.
 */
export async function withFeatureState(
  page: Page,
  key: FeaturePreviewKey,
  target: 'on' | 'off',
  fn: () => Promise<void>,
): Promise<void> {
  const previous = await setFeatureState(page, key, target)
  try {
    await fn()
  } finally {
    if (previous !== target) {
      await setFeatureState(page, key, previous).catch(() => {
        /* best-effort restore */
      })
    }
  }
}

/**
 * Flip a batch of features to `target` in a single dialog open/close
 * cycle, run `fn`, then restore all originals in another single cycle.
 *
 * Same semantics as N nested `withFeatureState` calls, but ~Nx faster
 * because each open/close of the FP dialog costs 8–10s. Used by the
 * nightly "all-features-ON" matrix where attribution-on-failure is
 * cheap (manual bisect) but per-feature open/close is wasteful.
 */
export async function withFeatureStates(
  page: Page,
  keys: readonly FeaturePreviewKey[],
  target: 'on' | 'off',
  fn: () => Promise<void>,
): Promise<void> {
  const setBatch = async (entries: readonly { key: FeaturePreviewKey; want: 'on' | 'off' }[]) => {
    await openFeaturePreviewDialog(page)
    for (const { key, want } of entries) {
      await selectFeatureTab(page, key)
      const current = await readToggleState(page, key)
      if (current !== want) {
        await clickToggle(page, key)
        const after = await readToggleState(page, key)
        if (after !== want) {
          throw new Error(`Failed to set "${key}" to ${want} — still reads ${after}`)
        }
      }
    }
    await closeFeaturePreviewDialog(page)
  }

  // Pass 1: read+set everything to target, capturing previous values.
  await openFeaturePreviewDialog(page)
  const previous: Record<string, 'on' | 'off'> = {}
  for (const key of keys) {
    await selectFeatureTab(page, key)
    const current = await readToggleState(page, key)
    previous[key] = current
    if (current !== target) {
      await clickToggle(page, key)
      const after = await readToggleState(page, key)
      if (after !== target) {
        throw new Error(`Failed to set "${key}" to ${target} — still reads ${after}`)
      }
    }
  }
  await closeFeaturePreviewDialog(page)

  try {
    await fn()
  } finally {
    const toRestore = keys
      .filter(k => previous[k] !== target)
      .map(k => ({ key: k, want: previous[k] }))
    if (toRestore.length > 0) {
      await setBatch(toRestore).catch(() => {
        /* best-effort restore */
      })
    }
  }
}
