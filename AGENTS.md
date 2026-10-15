# AGENTS.md — Gitako

Guidance for AI agents and contributors working in this repo. Short and
normative; when in doubt, follow the existing code and test conventions and
the policy below.

## E2E tests must be human-user operations

This is a **user-behavior** test suite, not a DOM-scraping harness. A spec
should reproduce what a real person does in the browser, through the real UI:

- Real `click()` / `hover()` / `press()` on visible elements (the GitHub and
  Gitako controls a user actually sees), not `page.evaluate(...)` synthetic
  clicks or `dispatchEvent`.
- Real keyboard input where a user types/keys (`page.keyboard.press`), real
  mouse where a user points.
- Real navigation the way a user navigates: clicking a nav tab / a file node /
  the branch picker, going "back", following a link. Do not invoke GitHub's
  internals (e.g. `Turbo.visit(...)`) to move the user around.

**Only use a script-based step when it is genuinely essential for that test**,
and then (a) justify it in a comment next to the step, and (b) prefer the
least-invasive form:

- Counting / asserting DOM structure (drift tripwires) — `page.evaluate` on
  selectors is essential here; a user doesn't "click" a selector count.
- Injecting or clearing a profile token / forcing test config without
  polluting the shared signed-in profile — a setup step, not the behavior
  under test; keep it clearly scoped to setup.
- Driving a path that only exists at the implementation level (e.g. asserting
  a Turbo/PJAX body-swap invariant, or a synthetic click where a real mouse
  deterministically tears the page down). Document why it's the only way.

Never make a script-based action the *subject* of a test; the subject is
always what the user experiences. If a test's premise can only exist under a
given GitHub DOM state (e.g. Turbo soft navigation, which GitHub only ships
when its modern Feature-Preview cohort is enabled), detect that state at
runtime and **skip** or **branch** honestly rather than waiting on an
internal global (`window.Turbo`) that may legitimately be absent — that wait
is both a script-only step and a source of false failures.

### Detecting GitHub's own file tree

When a test depends on whether GitHub is showing its **native file tree**
(which decides Gitako's defer-to-native auto-collapse), verify it is *really
shown* — the element exists **and** has a non-zero bounding box
(`getBoundingClientRect()` width×height > 0) — not merely that the
`#repos-file-tree` element or its expand toggle is present. A tree that is
present but collapsed/hidden behind a toggle must not be treated as shown.
See `e2e/feature.auto-collapse-hint.signed-in.spec.ts` for the canonical
check. If the native tree is really shown and a spec is exercising **Gitako's**
tree, open Gitako first (a real tentacle click) before continuing; if the
test's goal is the collapse/defer behavior itself, assert that collapse.

## Repo conventions

- **Architecture:** MV3 Chrome extension. `src/content.tsx` (content script),
  `src/background.ts`, `src/platforms/<host>/` per-host adapters via
  `src/platforms/platform.ts`. GitHub-specific DOM coupling lives in
  `src/platforms/GitHub/DOMHelper.ts` and `URLHelper.ts`; add selectors there
  (or in `e2e/selectors.ts` for tests), don't inline them.
- **Config:** `src/utils/config/`; `intelligentToggle` (auto-expand) and
  `sidebarToggleMode` (persistent/float) drive sidebar expansion. The URL
  config channel (`?gitako-config-…`) is test-only.
- **Bindings:** selectors matching GitHub DOM should handle both the modern
  and legacy variants and document fallbacks (e.g. code-view embedded JSON
  matches `app-name="code-view"` **and** `app-name="react-code-view"`, with a
  `#ref-picker` / `octolytics` fallback) — GitHub serves different DOM
  depending on the user's Feature Preview state.
- **Tests:** Playwright, persistent Chromium against `e2e/.profile`
  (signed-in bot). Read `e2e/README.md` before adding a spec — it documents
  the two-pass Feature Preview matrix, signed-in gating, drift tripwires, and
  the coverage map (keep it current).
- **Build:** `yarn build` (webpack to `dist/`); typed via `tsc`. Jests run via
  `yarn test:unit`. Prettier/eslint/lint-staged run on commit.

## When you change behavior

Update the corresponding spec and the coverage map in `e2e/README.md`. A
behavior without an active assertion is a silent gap — "renders" is not
"covered."
