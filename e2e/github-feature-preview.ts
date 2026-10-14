/**
 * Tracker for known GitHub Feature Preview entries.
 *
 * GitHub ships per-user opt-in features through the avatar → "Feature
 * preview" dialog. Each feature can change DOM shape in ways that
 * affect Gitako (e.g. PR file-tree virtualization, new dashboard
 * surfaces). This module is the single source of truth for what we
 * know is in that dialog.
 *
 * The accompanying drift spec (`drift.github-feature-preview.spec.ts`)
 * scrapes the live dialog and asserts every visible key is in this
 * tracker AND every tracker key is in the dialog. New GitHub feature
 * → drift test fails with "unknown key X — evaluate impact and add a
 * row." Removed GitHub feature → drift test fails with "expected key
 * Y missing — feature GA'd or rolled back; remove the row or update
 * the GA list."
 *
 * The `affectsGitako` field drives our decision-making:
 * - "yes": needs e2e coverage or a separate fix branch
 * - "no":  fully orthogonal to Gitako's surface; documented and skipped
 * - "unknown": probe needed; default for newly-added entries
 *
 * Inventoried 2026-05-26 against the bot account. List is account-
 * dependent (different users see different previews); refresh by
 * running the drift spec against your own account if you suspect
 * gaps.
 */

export type FeaturePreviewKey =
  | 'color_modes_color_blind_themes_2'
  | 'command_palette'
  | 'copilot_chat_custom_instructions'
  | 'ipynb-diff'
  | 'prx_files'
  | 'pull_request_files_virtualization'
  | 'repo_pulls_dashboard_surface'
  | 'slash_commands_beta'

export type FeaturePreviewEntry = {
  title: string
  affectsGitako: 'yes' | 'no' | 'unknown'
  why?: string
}

export const knownFeaturePreviewItems: Record<FeaturePreviewKey, FeaturePreviewEntry> = {
  color_modes_color_blind_themes_2: {
    title: 'Colorblind themes',
    affectsGitako: 'no',
    why: 'Palette-only. Gitako passes the named scheme through to @primer/react.',
  },
  command_palette: {
    title: 'Command Palette',
    affectsGitako: 'no',
    why: 'Global keyboard overlay; doesn’t change repo DOM.',
  },
  copilot_chat_custom_instructions: {
    title: 'Organization Custom Instructions',
    affectsGitako: 'no',
    why: 'Copilot-only.',
  },
  'ipynb-diff': {
    title: 'Rich Jupyter Notebook Diffs',
    affectsGitako: 'no',
    why: 'Affects blob render only; Gitako does not inspect blob content.',
  },
  prx_files: {
    title: 'New Files Changed Experience',
    affectsGitako: 'yes',
    why:
      'Changes the PR /files DOM. Already known to have eaten pullRequestsFilesRoute.diffSummaries' +
      ' from the embedded JSON (see fix/pr-diff-summaries-api branch).',
  },
  pull_request_files_virtualization: {
    title: 'New Files Changed Perf Experiment',
    affectsGitako: 'yes',
    why:
      'Virtualises the PR file list. Same surface area as code-view virtualization that broke' +
      ' code-fold (see fix/code-fold-current-dom branch).',
  },
  repo_pulls_dashboard_surface: {
    title: 'New Repository Pull Requests Dashboard',
    affectsGitako: 'unknown',
    why: 'Repo /pulls list page. Gitako is absent on /pulls, so likely no impact; verify before marking no.',
  },
  slash_commands_beta: {
    title: 'Slash Commands',
    affectsGitako: 'no',
    why: 'Input overlay only.',
  },
}
