import * as fs from 'fs'
import { expect, test } from './fixtures'
import { cssVarsBaselinePath, waitForStableGitHubCssVars } from './githubCssVars'

// Maintenance script: refresh the baseline for one Feature-Preview floor
// after a known-good GitHub deploy. Gated behind an env var so the regular
// e2e suite doesn't accidentally overwrite the baseline, and behind an
// explicit floor so an ambient-profile run can't write the wrong file. To run:
//
//   CAPTURE_CSS_BASELINE=1 GITAKO_PREVIEW_TARGET=off yarn playwright test e2e/maint.capture-css-baseline.spec.ts
//   CAPTURE_CSS_BASELINE=1 GITAKO_PREVIEW_TARGET=on  yarn playwright test e2e/maint.capture-css-baseline.spec.ts
//
// The companion `drift.github-css-vars.spec.ts` then diffs live state
// against the baseline for the same floor.
const FLOOR =
  process.env.GITAKO_PREVIEW_TARGET === 'off'
    ? 'off'
    : process.env.GITAKO_PREVIEW_TARGET === 'on'
      ? 'on'
      : null

test.skip(
  !process.env.CAPTURE_CSS_BASELINE,
  'Set CAPTURE_CSS_BASELINE=1 to refresh the baseline file.',
)
test.skip(
  FLOOR === null,
  'Set GITAKO_PREVIEW_TARGET=off|on so the baseline lands on the right floor.',
)

test('refresh CSS custom property baseline', async ({ extensionPage }) => {
  await extensionPage.goto('https://github.com/EnixCoda/Gitako/tree/develop')
  const vars = await waitForStableGitHubCssVars(extensionPage, 500)
  const baselinePath = cssVarsBaselinePath(FLOOR!)
  fs.writeFileSync(baselinePath, vars.join('\n') + '\n')
  console.log(`wrote ${vars.length} CSS custom property keys to ${baselinePath}`)
  expect(vars.length).toBeGreaterThan(500)
})
