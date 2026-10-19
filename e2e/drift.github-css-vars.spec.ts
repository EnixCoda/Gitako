import * as fs from 'fs'
import * as path from 'path'
import { expect, test } from './fixtures'
import { cssVarsBaselinePath, waitForStableGitHubCssVars, type CssVarsFloor } from './githubCssVars'

/**
 * Detect changes to GitHub's CSS design-token surface.
 *
 * The CSS custom property keys defined on `:root` (Primer's design
 * tokens) are stable per deploy. When GitHub adds or removes a token,
 * this test surfaces the diff so we can decide if Gitako needs to
 * follow (typically: only if it references the removed key directly,
 * which it currently doesn't — but knowing first is the point).
 *
 * The baseline is floor-specific: `e2e/github-css-vars.baseline.off.txt`
 * for the all-OFF Feature-Preview pass and
 * `e2e/github-css-vars.baseline.txt` for the modern render. GitHub does
 * not ship the same token set at both floors, so a single file would
 * make one pass fail on the other's extras.
 *
 * Under the nightly (`GITAKO_PREVIEW_TARGET` set) the diff is strict
 * against that pass's floor. A local run has no target and the shared
 * profile may have been left on either floor (the nightly ends on `on`,
 * an interrupted run can leave `off`), so accept either floor's baseline
 * and only fail when the live set matches neither.
 *
 * Refresh via `e2e/maint.capture-css-baseline.spec.ts` (kept out of the
 * regular suite because it WRITES the baseline) with the target floor.
 * Light and dark schemes produce the same key set; we probe light only.
 */

const TARGET = process.env.GITAKO_PREVIEW_TARGET
const FLOOR_BASELINES: { floor: CssVarsFloor; path: string }[] = TARGET
  ? [{ floor: TARGET === 'off' ? 'off' : 'on', path: cssVarsBaselinePath() }]
  : (['on', 'off'] as const).map(floor => ({ floor, path: cssVarsBaselinePath(floor) }))

function readBaseline(baselinePath: string): string[] {
  return fs
    .readFileSync(baselinePath, 'utf8')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

type Diff = { added: string[]; removed: string[] }

function diffAgainst(baselineKeys: string[], live: string[]): Diff {
  const baseline = new Set(baselineKeys)
  const liveSet = new Set(live)
  return {
    added: live.filter(k => !baseline.has(k)),
    removed: [...baseline].filter(k => !liveSet.has(k)).sort(),
  }
}

const diffSize = (d: Diff) => d.added.length + d.removed.length

test.describe('drift: GitHub CSS design tokens', () => {
  test(':root custom property keys match baseline', async ({ extensionPage }, testInfo) => {
    const available = FLOOR_BASELINES.filter(b => fs.existsSync(b.path))
    test.skip(
      available.length === 0,
      'no CSS baseline for this floor yet — capture it with CAPTURE_CSS_BASELINE=1 ' +
        'and GITAKO_PREVIEW_TARGET=<floor>',
    )

    await extensionPage.goto('https://github.com/EnixCoda/Gitako/tree/develop')
    const largestBaseline = Math.max(...available.map(b => readBaseline(b.path).length))
    const live = await waitForStableGitHubCssVars(extensionPage, largestBaseline - 25)

    const results = available.map(b => ({
      ...b,
      diff: diffAgainst(readBaseline(b.path), live),
    }))
    const match = results.find(r => diffSize(r.diff) === 0)
    if (match) return

    // No candidate matched. Report the closest floor so the diff is useful;
    // for a nightly (single candidate) that is the only floor, as before.
    const closest = results.sort((a, b) => diffSize(a.diff) - diffSize(b.diff))[0]
    await testInfo.attach('github-css-vars-diff', {
      body: JSON.stringify({ floor: closest.floor, ...closest.diff }, null, 2),
      contentType: 'application/json',
    })

    expect(
      closest.diff,
      `GitHub CSS design tokens differ from the ${closest.floor} baseline ` +
        `(${path.basename(closest.path)}) — refresh it via ` +
        'maint.capture-css-baseline.spec.ts after confirming the change is ' +
        'benign for Gitako',
    ).toEqual({ added: [], removed: [] })
  })
})
