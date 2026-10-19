# Gitako e2e strategy

This file is the single place to learn how the e2e suite is meant to work,
and what it does and does not cover. Read it before adding or debugging a
spec. The companion nightly runner lives in `../../gitako-e2e/`.

## How a spec runs

- Tests use Playwright's **persistent Chromium context** with the built
  extension loaded from `../dist` (see `fixtures.ts`). There is no headless
  mode — the extension needs a real browser.
- The context is launched against a **profile directory** resolved by
  `resolveProfilePath()`: `PLAYWRIGHT_PROFILE` env > `e2e/.profile` > none.
  `e2e/.profile` is a checked-in profile signed in as the bot account.
- **Signed-in vs anonymous.** Specs that only make sense signed in must gate
  themselves with `test.skip(!resolveProfilePath(), '…')` so they no-op when
  no profile is configured (e.g. `feature.pr-diff-summaries.signed-in.spec.ts`,
  `signed-in.spec.ts`). The DOM differs between signed-in and anonymous
  GitHub, so a selector verified in one may not hold in the other — note
  which you relied on.
- **Serial only.** Persistent contexts share one profile dir and take a
  filesystem lock; parallel workers race on it (`createContext` in
  `fixtures.ts`). The nightly runner forces `--workers=1`. A flaky
  "createContext" failure under default workers is this, not a real bug.

## Writing specs: user flows first, script only when essential

This suite audits what a real signed-in user experiences. Write each spec as the
**human operation** — real `click()` / `hover()` / `press()` on the controls a
user actually sees, real keyboard input, and real navigation the way a user
navigates (clicking nav tabs, file nodes, the branch picker, "back"). Index
quality: a maintainer should be able to read the steps and recognize what a
person did, and anyone watching the video should see those steps.

Use a **script-based step only when it is genuinely essential** for that test,
and justify it in a comment next to it:

- **Counting structure** (drift tripwires) — `page.evaluate` over selectors is
  essential; a user can't "click" a selector count.
- **Setup that must not pollute the shared profile** — the URL-config channel
  (`?gitako-config-…`) and token provisioning (via the OAuth/`chrome.storage`
  flow in `globalSetup.ts`) are setup, not behavior under test; keep them
  clearly scoped to setup.
- **An implementation-level invariant that only exists as such** — e.g. the
  Turbo `body`-swap root-identity test, or a synthetic click where a real
  mouse deterministically tears the page down. Say why it's the only way.

Two rules of thumb that prevent both false failures and false confidence:

1. **Don't wait on GitHub internals to drive the test.** Avoid
   `waitForFunction(() => window.Turbo !== undefined)` and `Turbo.visit(...)`.
   GitHub only ships soft navigation (Turbo/PJAX) when the account has the
   modern Feature-Preview cohort enabled; at the all-OFF floor it serves a
   legacy render with full page loads. Specs should drive the real user action
   and assert the outcome. If a spec's premise is a soft-nav invariant, detect
   soft-nav at runtime and skip/branch honestly rather than waiting on a
   global that may legitimately be absent.
2. **Detect GitHub's own file tree by visibility, not existence.** When a spec
   depends on whether GitHub shows its native file tree, require the element
   to be present **and** have a non-zero bounding box
   (`getBoundingClientRect()` width×height > 0) — not merely that
   `#repos-file-tree` or its expand toggle exists. See
   `feature.auto-collapse-hint.signed-in.spec.ts` for the canonical check. If
   the native tree is really shown and the spec exercises **Gitako's** tree,
   open Gitako first (real tentacle click) before continuing; if the spec's
   goal is the defer/collapse behavior itself, assert that collapse.

The floor-dependence (rule 1) is exactly why the two-pass matrix multiplies
specs; a spec that silently can't run under one floor should say so explicitly
(an honest skip) rather than pass vacuously or fail on a missing global.

## Provisioning the profile's access token

Signed-in specs need Gitako to hold a GitHub access token. Without one Gitako
calls the GitHub API anonymously (60 req/hour); a full run — let alone the
nightly's two passes — exhausts that mid-suite, the tree fetch fails, and
Gitako blanks the file list, surfacing as flaky "node-item not found" failures
across unrelated render/nav/pjax/search specs. An authenticated token raises
the ceiling to 5000 req/hour and removes that whole class of drift.

`globalSetup.ts` ensures a token before any spec runs, in one of two modes:

- **Nightly, `off` pass (`GITAKO_PREVIEW_TARGET=off`)** — treats a working OAuth
  round-trip *and* a fresh token as a **hard precondition**. It (1) clears the
  profile's token via the Settings "Clear" button, then (2) drives the real
  OAuth flow ("Create with OAuth" → authorize → `?code` exchange via
  `gitako.enix.one` → "Your token has been saved"). Any failure **throws and
  aborts the whole run** — including GitHub's unattended-impossible sudo gate —
  so the suite never runs against a half-provisioned profile. Both steps are
  UI-driven (no `chrome.storage` service-worker evaluate, which can hang during
  worker activation). Because step 1 destroys the token, an abort leaves the
  profile token-less; re-provision with `node e2e/scripts/oauth-bootstrap.mjs`.
  OAuth runs **once per nightly**: the runner always does `off` then `on` against
  the same profile, so the `on` pass below reuses the token this pass minted.
- **Nightly, `on` pass (`GITAKO_PREVIEW_TARGET=on`)** — no OAuth; just ensures
  the token the `off` pass minted is present (same detect path as local).
- **Local single-spec runs (no preview target)** — skips the destructive OAuth
  and just *ensures a token exists*: it reads the profile's token via the
  service worker and, only if absent, seeds `GITAKO_ACCESS_TOKEN` (`.env`).
  Best-effort — if the worker is unreachable it warns and lets the run proceed
  on whatever the profile already holds.

The token-less specs (`feature.oauth`, `maint.oauth-bootstrap`) bring their own
fresh/cleared profiles, so neither mode disturbs them.

Other ways to put a token in the profile by hand:

- **Manual PAT** — paste a least-privilege token into Settings → Access Token
  → "Or input here manually". Simple, no infra.
- **OAuth bootstrap (preferred for setup)** — drive Gitako's real OAuth flow so
  you never hand-handle a secret. Two entry points share the same flow:

  - **Interactive (headed, recommended for first/expired setup):**

    ```sh
    node e2e/scripts/oauth-bootstrap.mjs
    ```

    Opens a headed browser on the profile and pauses on GitHub's authorize
    page so a human can satisfy the one-time **sudo gate** ("Confirm access" /
    "Verify via email") that the headless spec can't. It then auto-detects the
    minted token. This core script lives in the gitako repo.

  - **Headless (opt-in maintenance spec, for when sudo is already satisfied):**

    ```sh
    GITAKO_OAUTH_BOOTSTRAP=1 npx playwright test maint.oauth-bootstrap --workers=1
    ```

    Same flow, but it **skips cleanly** if GitHub demands sudo (can't re-auth
    headlessly). Use it once the profile's sudo window is open.

  Both clear any existing token, click "Create with OAuth (recommended)", let
  GitHub's authorize step redirect back (the profile's session approves it),
  and let Gitako exchange the `?code` for a token via `gitako.enix.one`.

  **Build dependency:** the OAuth `client_id` is baked into `dist` at build
  time from `GITHUB_OAUTH_CLIENT_ID` (`src/env.ts` → `getOAuthLink`). A `dist`
  built without it sends `client_id=` and GitHub serves a 404 — the spec
  guards for this and fails with a clear message. Build with the OAuth env (the
  nightly runner's `.env` carries it) before bootstrapping.

  **It is destructive** (clears the token first) and depends on live external
  state, so it is double-gated (`resolveProfilePath()` **and**
  `GITAKO_OAUTH_BOOTSTRAP=1`) and never runs in the normal/nightly suite. To
  try it without risking a working token, point `PLAYWRIGHT_PROFILE` at a
  **copy** of `e2e/.profile` and run against that.

The OAuth *entry point* (the UI that starts this) is covered non-destructively
by `feature.oauth.spec.ts`, which uses its own token-less context — no
secrets, no server, safe for every run.

## The two-pass Feature Preview matrix (important — easy to forget)

GitHub ships per-account opt-in features via avatar → "Feature preview".
Different accounts see different DOM. Gitako breaks when a preview changes a
surface it scrapes (PR files, code view, etc.).

To cover both extremes, the nightly runner (`GITAKO_FEATURE_MATRIX=1` in
`../../gitako-e2e/run.sh`) runs the **whole suite twice**:

1. `GITAKO_PREVIEW_TARGET=off` — `globalSetup.ts` turns **every** known
   preview flag OFF, then runs all specs.
2. `GITAKO_PREVIEW_TARGET=on` — same, all flags ON.

`globalSetup.ts` normalizes the flags listed in `github-feature-preview.ts`
before each pass. This is the canonical way both PR experiences get covered:

- all-OFF → classic PR files DOM (checkbox-based viewed state)
- all-ON  → "New Files Changed Experience" (embedded `diffSummaries` JSON)

The all-OFF floor is also a **full-page-load, no-Turbo** render. Specs must
not depend on soft-navigation internals (`data-turbo-frame`, `window.Turbo`,
module singletons surviving a body swap) to find controls or to keep state
across a navigation. Detect the navigation model and branch honestly instead:
`lifecycle.identity` skips the body-swap invariant when Turbo is absent, the
keyboard matrix runs its open but skips focus continuity after a full document
load, and the CSS-vars tripwire keeps a per-floor baseline
(`github-css-vars.baseline.off.txt` vs `github-css-vars.baseline.txt`).

### Consequence for writing specs

**Do not pin a spec to a feature state with `withFeatureState` just to cover
both experiences** — the matrix already sets global state per pass, and
pinning fights it. Write a plain assertion; let the two passes multiply it.

**Caveat — the matrix only multiplies assertions that already exist.** If a
feature has no assertion, both passes pass vacuously and a regression in
either experience is invisible. This is exactly how review-marker breakage
went unnoticed: there was no `.node-item-reviewed` assertion at all until
`feature.pr-diff-summaries.signed-in.spec.ts` was added. **Coverage = assertions ×
matrix, and a missing assertion zeroes the product.** Keep the coverage map
below honest.

`withFeatureState` / `withFeatureStates` (in `featurePreview.ts`) still have a
place: toggling a *single* feature mid-test when a spec specifically needs to
observe the transition, not to substitute for the matrix.

## Videos

Specs run in a persistent context, which ignores `playwright.config`'s `video`
option — so recording is controlled in `fixtures.ts`:

- **`GITAKO_VIDEO=1`** records **every** test. The nightly runner sets this, so
  every nightly test produces a video; set it yourself for local debugging:
  `GITAKO_VIDEO=1 npx playwright test <spec>`.
- Otherwise, a test records only on **retry attempts** (`testInfo.retry > 0`) —
  the `on-first-retry` equivalent, so a flaky test's retry is captured under
  plain `--retries` runs (e.g. CI) without recording the passing majority.

Files are named `<spec>__<test-title>__retryN__pageN.webm` (the `retryN` /
`pageN` suffixes appear only when relevant), so they're self-describing rather
than Playwright's default hash.

**Where they land:**

- **Local:** `test-results/videos/` in the repo root.
- **Nightly:** the runner records inside its throwaway worktree, then copies the
  videos into `../../gitako-e2e/logs/` (next to each run's HTML/JSON report)
  before the worktree is torn down, named
  `<YYYYMMDD-HHMMSS>-<off|on>-<spec>__<test>__…​.webm`. Retention keeps the
  newest 5 runs' worth (a full run is ~160 videos); older ones are pruned.

## Spec families

- `drift.*` — tripwires for GitHub changing out from under us. They assert
  structure (selector presence, page shape, CSS vars, the Feature Preview
  tracker membership), not Gitako behavior. When GitHub ships a change these
  go red first, pointing at what to re-verify. Floor-dependent structure is
  asserted against the floor it belongs to (the CSS vars baseline has an
  `off` variant).
- `pjax.*` — soft-navigation (pjax/turbo) transitions keep Gitako mounted and
  correct.
- `feature.*` — a specific Gitako feature end to end.
- `nav.*`, `state.*`, `ui.*`, `lifecycle.*`, `theme.*`, `error.*`,
  `keyboard.*` — the remaining surfaces, grouped by area.
- `maint.*` — maintenance helpers (e.g. capture a CSS baseline), not asserts.
- `*.signed-in.*` — requires the bot profile; skips without it.
- `baseline` and `signed-in` are the two intentional family-less anchors:
  the anonymous and signed-in "sidebar mounts at all" smoke checks. Every
  other spec carries a `<family>.` prefix.

`selectors.ts` centralizes selectors with a comment per entry explaining why
it is stable. Prefer adding there over inlining a selector in a spec.

## Feature → coverage map

Keep this current when adding specs or Gitako features. "Covered" means a
spec actively asserts the behavior — not merely that the page renders.

| Gitako feature / surface        | Spec                                   | Status |
| ------------------------------- | -------------------------------------- | ------ |
| Sidebar mounts on repo          | `baseline`, `signed-in`                | ✅ |
| Absent on github.com home       | `nav.homepage-absent`                  | ✅ |
| Empty repo handling             | `feature.empty-project`                | ✅ |
| Branch name resolution / switch | `feature.branch-switch`, `nav.branch-content` | ✅ |
| Auto-expand to current file     | `feature.expand-to-target`             | ✅ |
| File search                     | `ui.search`                            | ✅ |
| Copy-snippet button             | `feature.copy-snippet`                 | ✅ |
| Keyboard shortcuts              | `keyboard.shortcut`                    | ✅ |
| File tree keyboard navigation   | `keyboard.tree-navigation`             | ✅ signed-in only. **Matrix: mode × source × method** (2 × 4 × 2 = 16 cells) **+ a PR diff-tree block**. mode ∈ {persistent, float}; source ∈ {repo-root, blob, subfolder, issue}; method ∈ {keyboard, mouse}. Opening a file navigates to `/blob/`. **keyboard** ⇒ focus stays in `.file-explorer`, persistent stays expanded, a final ArrowDown still moves the highlight (continuity). **mouse** is the negative control ⇒ persistent + native tree auto-collapses and releases focus as before the fix; float just smoke-checks the open navigated (no collapse ⇒ nothing dispatches focus away). Non-vacuous: the persistent-keyboard cells FAIL without the fix; float-keyboard + all mouse cells pass either way (coverage/guards). Skips a cell if the bar can't expand or no leaf file is found (drift). **`issue` source** is the cross-context case: an issue page renders the default-branch repo tree, and opening a file changes the committed repo meta, which flashes `RepoContextWrapper`'s `disabled` state and remounts the sidebar — the fix keeps `keyboardNavRef` alive (module singleton) across the remount and re-seeds expand/focus on mount, so the same assertions hold; without it the bar remounts collapsed with focus on `<body>`. **PR diff-tree block** (`pull/<N>/changes`, persistent): the changed-files tree's leaves are diff anchors and opening one is a same-page `#diff-<hash>` scroll (no navigation, no collapse). Asserts focus stays in the tree (the focusout-guard restores it from `<body>`) and arrowing stays live — the highlight may reset (the `#diff` hash re-fires the after-redirect path, which recomputes an empty current-path on a changes page and clears it) so ArrowDown re-anchors rather than necessarily moving off the opened file. Native-tree (GitHub Feature Preview) state is runtime-detected, not toggled; the nightly run flips it externally and re-runs. At the all-OFF floor the open is a full document load, so each keyboard cell drives the open and asserts the destination but skips the focus-continuity half (a module singleton cannot cross a new JS context) |
| Dock mode (float/persistent)    | `state.toggle-mode-persistence`        | ✅ |
| Sidebar placement (left/right)  | `state.placement-right`                | ✅ right dock via URL-config (`sidebarPlacement="right"` + `intelligentToggle=true` to pin expanded past the signed-in native repo tree); asserts `.placement-right` body wrapper, absence of `.placement-left`, and the right-side body indent `html[data-with-gitako-spacing="right"]`. Left placement is implicitly the default everywhere else |
| Sidebar auto-collapse hint (persistent + auto, native tree shown) | `feature.auto-collapse-hint.signed-in` | ✅ signed-in only. A blob page is the reliable trigger: github.com renders the code-view file tree (`#repos-file-tree`) by default there, so persistent + auto stays collapsed and `turbo:load` (fires on initial load too) raises the hint. Asserts the bar is collapsed, the hint popover is visible, Dismiss hides it, a reload re-fires it (not one-time-ever), and "Don't show again" gates it off. Skips if the native tree isn't shown (drift / narrow viewport). PR pages also have a native tree but only past a file-count threshold and behind an "Expand file tree" toggle, so they're not used as the fixture |
| Defer to GitHub native file tree (`deferToNativeFileTree`) | `feature.native-tree-defer.signed-in` | ✅ signed-in only. Verifies the setting: default (unset/true) keeps the pinned bar collapsed when GitHub really shows its own code-view file tree; `?gitako-config-deferToNativeFileTree=false` keeps Gitako's sidebar expanded despite the native tree (no hint, no deferral). Same native-tree visibility precondition as the hint spec |
| No auto-expand on issue pages   | `feature.issue-page.signed-in`         | ✅ signed-in only. `shouldExpandSideBar()` excludes issue pages (isInIssuePage was removed), so persistent + auto stays collapsed on `/issues/<N>` — unlike code/commit/pull pages. Asserts the bar is collapsed, no auto-collapse hint appears (issues have no native tree — this is NOT the native-tree collapse), and the default-branch tree still loads when the user expands manually. Control test: pinned expanded (`intelligentToggle=true`) on the same issue page expands and renders the tree, proving the page is a valid Gitako page that just doesn't auto-expand |
| Theme mount                     | `theme.mount`                          | ✅ |
| pjax/turbo navigation           | `pjax.*`                               | ✅ |
| Rate-limit error UI             | `error.api-rate-limit`                 | ✅ |
| PR page mount + file tree       | `nav.pull-request-page`                | ✅ |
| PR file node click → in-page jump to that file's diff (already on files/changes page) | `nav.pull-request-page` | ✅ same-page hash jump; asserts the page hash becomes `#diff-<hash>` and the matching diff block scrolls into view. Works in **both** experiences (classic `/files` and the New Files Changed `/changes` route), so the full scroll contract holds across the matrix. Relies only on the hash + `#diff-<id>` block (no `[data-path]`) |
| PR file node click from the conversation page → cross-page nav to the diff | `nav.pull-request-page` | ✅ runtime-branches on the active experience (detected from the node's resolved href: `/files` = classic, `/changes` = new). **Classic:** fragment preserved, scrolls to the diff (full contract). **New experience:** GitHub's React `/changes` router lands on the page but DROPS the `#diff-` fragment, so it does NOT scroll — pins the reduced contract (reached `/changes` + the file's diff block is present in the DOM). The scroll gap is a documented GitHub-SPA limitation, not a Gitako bug (a direct full-load of the same `/changes#diff-…` URL scrolls fine) |
| PR file node click in single-file mode → selects that file | `feature.pr-single-file-mode.signed-in` | ✅ New Files Changed Experience only: large PRs offer `?mode=single` (one diff at a time in `#diff-comparison-viewer-container`). Gitako carries the `?mode=single` query through the node href, so a click is a same-page hash swap; asserts the target file's diff becomes the visible, in-viewport block. Navigates straight to `?mode=single` and skips when the viewer didn't mount (classic experience / all-OFF pass) |
| PR body indent in persistent dock mode (native PR tree absent) | `feature.pr-body-indent.signed-in` | ✅ asserts `<html data-with-gitako-spacing="left">` (→ body margin) after clicking a node on `/changes`, when GitHub's native PR file tree is not active; skips the native-tree-shown case (Gitako defers the gutter to it) |
| PR files-page DOM reuse — no redundant page refetch | `feature.pr-files-dom-reuse.signed-in` | ✅ New Files Changed Experience only: on `/changes`, building the tree must reuse the loaded page document, not refetch `github.com/<owner>/<repo>/pull/<N>/files`. Spies on `page.on('request')` and asserts that fetch never fires. Guards `isInPullFilesPage()` (URLHelper.ts), which once matched only `/files` and so dropped the reuse fast path on `/changes` — a perf-only regression invisible to every output assertion (the refetched `/files` doc returns the same new-experience data), which is why the matrix alone never caught it |
| PR per-file viewed markers (initial render) | `feature.pr-diff-summaries.signed-in` | ✅ (both experiences via matrix) |
| PR viewed markers — live update + reload persistence | `feature.pr-diff-summaries.signed-in` | ✅ classic `change` path: drives the checkbox, asserts the marker flips live, reloads and asserts the persisted state, then restores; skips on the new experience |
| PR per-file diff stats (`.node-item-diff`)   | `feature.pr-diff-summaries.signed-in` | ✅ asserts the badge + change-count title |
| PR per-file comment counts (`node.comments`) | `feature.pr-diff-summaries.signed-in` | ✅ asserts the `.node-item-comment` badge + "N active" title on PR #197's `.babelrc` (a live in-diff comment). Guards the `getCommentsMap` bucketing fix: it now splits on `line === null` (outdated → resolved) instead of `position === null`, which mislabelled every current comment as resolved and rendered no badge. Verified against real PRs — GitHub's line-based review API keeps a non-null `position` on outdated comments but nulls their `line` |
| OAuth token entry point         | `feature.oauth`                        | ✅ token-less context asserts the OAuth link + manual fallback render |
| OAuth full round-trip (bootstrap) | `maint.oauth-bootstrap`              | ⚙️ opt-in only (`GITAKO_OAUTH_BOOTSTRAP=1`); provisions the token, needs prod build + server |
| Code folding in blob view       | `feature.code-fold`                    | ✅ disabled on github.com (native gutter folding covers it; legacy DOM gone), preserved for GHE; spec asserts it stays inert |
| **PR file virtualization DOM**  | —                                      | ❌ gap (`pull_request_files_virtualization`, affectsGitako: yes) |

When you close a gap, move its row up and cite the spec. When you find a new
one, add a ❌ row immediately — a written gap is a future test; a silent gap
is a future incident.
