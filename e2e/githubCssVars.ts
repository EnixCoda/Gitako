import { expect, type Page } from '@playwright/test'
import * as path from 'path'

export type CssVarsFloor = 'off' | 'on'

/**
 * GitHub's `:root` design-token surface is floor-dependent: the all-OFF
 * Feature-Preview render omits tokens the modern render ships (e.g. the
 * lightningcss pair, `--pr-toolbar-sticky-header-height`,
 * `--tab-size-preference`). Keep one baseline per floor so the nightly's two
 * passes each diff against their own deploy instead of one masking the other.
 *
 * `off` has its own file; `on` uses the default
 * `github-css-vars.baseline.txt`. Pass the floor explicitly when it isn't the
 * active `GITAKO_PREVIEW_TARGET` (local runs, the capture spec).
 */
export function cssVarsBaselinePath(floor?: CssVarsFloor): string {
  const resolved = floor ?? (process.env.GITAKO_PREVIEW_TARGET === 'off' ? 'off' : 'on')
  const suffix = resolved === 'off' ? '.off' : ''
  return path.resolve(__dirname, `github-css-vars.baseline${suffix}.txt`)
}

export async function collectGitHubCssVars(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const collected = new Set<string>()
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      if (!rules) continue
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof CSSStyleRule)) continue
        if (!/^(:root|html)\b/.test(rule.selectorText)) continue
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style.item(i)
          if (prop.startsWith('--')) collected.add(prop)
        }
      }
    }
    return Array.from(collected).sort()
  })
}

export async function waitForStableGitHubCssVars(
  page: Page,
  minimumCount: number,
): Promise<string[]> {
  let previous = ''
  let stableSamples = 0
  let latest: string[] = []

  await expect
    .poll(
      async () => {
        latest = await collectGitHubCssVars(page)
        const serialized = JSON.stringify(latest)
        stableSamples = serialized === previous ? stableSamples + 1 : 0
        previous = serialized
        // Four identical samples (~2s with the intervals below) so a
        // stylesheet that lands after the first stable pair can't be mistaken
        // for a token removal — the per-floor baselines are only a few keys
        // apart, so a partial set would look like drift.
        return latest.length >= minimumCount && stableSamples >= 4
      },
      {
        message: `GitHub CSS variable set did not stabilize above ${minimumCount} keys`,
        timeout: 15000,
        intervals: [250, 500, 750],
      },
    )
    .toBe(true)

  return latest
}
