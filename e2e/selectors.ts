export const selectors = {
  github: {
    breadcrumbFileName: `[data-testid="breadcrumbs-filename"]`,
    fileContent: 'textarea[aria-label="file content"]',
    commitLinks: [
      `li[data-testid="commit-row-item"] [data-testid="list-view-item-title-container"] a[href*="/commit/"]`,
      `li[data-testid="commit-row-item"] h4 a[href*="/commit/"]`,
    ].join(),
    // assume title contains `.` is file item
    fileListItemFileLinks: `table[aria-labelledby="folders-and-files"] tr.react-directory-row td.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a[aria-label$="(File)"]`,
    fileListItemLinkOf: (name: string) =>
      `table[aria-labelledby="folders-and-files"] tr.react-directory-row td.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a[title="${name}"]`,
    commitPage: ['div.commit', '#diff-content-parent'].join(),
    // Repo-level Issues/PRs nav tabs. Anchor on the repo navigation landmark
    // (`aria-label="Repository"` — the accessible name a screen reader
    // announces) plus the tab's href suffix. That uniquely identifies the
    // Issues/Pulls tab without baking in the owner/repo, the locale, or
    // fragile React-generated ids/classes.
    //
    // Deliberately NOT `[data-turbo-frame="repo-content-turbo-frame"]`:
    // GitHub only puts that attribute on links that turbo-swap the repo
    // content frame, so it disappears on the all-OFF Feature-Preview floor,
    // which navigates with full page loads (no Turbo). Verified count=1 on
    // tree, blob, repo overview, and the Issues/Pulls index pages in both
    // floor renders.
    navBarItemIssues: 'nav[aria-label="Repository"] a[href$="/issues"]',
    navBarItemPulls: 'nav[aria-label="Repository"] a[href$="/pulls"]',
    // Legacy non-virtualized blob DOM that Gitako's code-fold feature
    // depends on (it walks `<tr>` rows inside this table). github.com no
    // longer ships it — blob pages render virtualized `.react-code-lines`
    // instead — which is why code-fold is now default-off there and kept
    // only for GitHub Enterprise. If this reappears on github.com, the
    // code-fold spec goes red and we revisit re-enabling.
    legacyBlobTable: '.blob-wrapper table',
    // Current virtualized blob code view that replaced the legacy table.
    // Used as the positive "blob page actually rendered" signal so the
    // code-fold no-op assertions aren't vacuous.
    codeViewLines: '.react-code-lines',
    // Classic ("New Files Changed Experience" off) per-file "Viewed"
    // checkbox in a PR's files page. Lives inside each file's
    // `[id^="diff-"]` block. Toggling it fires a `change` that Gitako's
    // useGitHubReviewStatus mirrors onto the matching node's reviewed
    // marker. The new experience replaces it with a React MarkAsViewedButton.
    prReviewedCheckbox: 'input.js-reviewed-checkbox[name="viewed"]',
  },
  gitako: {
    fileItem: '.gitako-side-bar .files .node-item',
    fileItemOf: (path: string) => `.gitako-side-bar .files .node-item[title="${path}"]`,
    // Per-file "Viewed" marker in the PR sidebar. Rendered ONLY when
    // `reviewed !== undefined`, i.e. only when resolveDiffSummaryMap
    // resolved `diffSummaries` from the fetched /pull/N/files embedded
    // JSON. Its presence is the precise tripwire for that data path —
    // if GitHub drops diffSummaries from the server-rendered files page,
    // this disappears. (.node-item-diff comes from the REST tree instead,
    // so it is NOT a signal for the embedded-JSON path.)
    reviewedMarker: '.gitako-side-bar .files .node-item .node-item-reviewed',
    // Per-file diff-stat badge (status + +/- counts) Gitako renders from
    // `node.diff`, which comes from the REST PR-tree compare — present on
    // every file node of a PR regardless of the files-changed experience
    // (so, unlike reviewedMarker, NOT a signal for the embedded-JSON path).
    diffMarker: '.gitako-side-bar .files .node-item .node-item-diff',
    // Per-file comment-count badge Gitako renders when a file has active
    // (non-outdated) PR review comments. Driven by `node.comments.active`,
    // which getCommentsMap (utils.ts) derives by bucketing comments whose
    // `line` is still in the diff as active. Renders only when the
    // commentToggle config is on (default true). Absent for files with no
    // live comments, so it is a precise signal that the comment data path
    // resolved AND the active/outdated split is correct.
    commentMarker: '.gitako-side-bar .files .node-item .node-item-comment',
    // Code-fold toggle Gitako injects into each foldable line's gutter
    // (see useGitHubCodeFold). On current github.com blob pages it must
    // NOT appear: the feature is default-off there and the legacy table
    // DOM it needs is gone. Its presence on github.com is a regression.
    codeFoldHandler: '.gitako-code-fold-handler',
    errorMessage: '#gitako-logo-mount-point .error-message',
    files: '.gitako-side-bar .files',
    bodyWrapper: '.gitako-side-bar .gitako-side-bar-body-wrapper',
    branchName: '.gitako-side-bar .branch-name',
    searchInput: '.gitako-side-bar input[aria-label="Search files"]',
    toggleButton: '.gitako-toggle-show-button',
    collapsedBodyWrapper: '.gitako-side-bar-body-wrapper.collapsed',
    bodyWrapperFloatMode: '.gitako-side-bar-body-wrapper.toggle-mode-float',
    bodyWrapperPersistentMode: '.gitako-side-bar-body-wrapper.toggle-mode-persistent',
    // Placement classes the body wrapper carries from `sidebarPlacement`.
    // The right variant is the experimental dock side; pinning it guards the
    // less-trodden CSS branch (resize handle side, body margin side).
    bodyWrapperPlacementRight: '.gitako-side-bar-body-wrapper.placement-right',
    bodyWrapperPlacementLeft: '.gitako-side-bar-body-wrapper.placement-left',
    // One-time hint shown when persistent + auto-expand stays collapsed
    // because GitHub's own file tree is present. Lives inside the toggle
    // button's fixed wrapper so it anchors to the tentacle.
    collapseHint: '.gitako-collapse-hint',
    collapseHintDismiss: '.gitako-collapse-hint .gitako-collapse-hint-dismiss',
    collapseHintNeverAgain: '.gitako-collapse-hint .gitako-collapse-hint-never',
    accessDeniedHeader: '.gitako-side-bar h2',
    // Settings UI — centralised here because labels live in visually-
    // hidden <label>s with React-Aria-generated `for` ids (Math.random()
    // strings). Specs find inputs/checkboxes by walking from the label
    // text to its for-target. Buttons are scoped to .gitako-side-bar so
    // we don't grab GitHub's own "Save"/"Clear" buttons elsewhere.
    settings: {
      openButton: '[aria-label="Settings"]',
      closeButton: '[aria-label="Close settings"]',
      // Settings panel title. Scoped to its own class so it never collides
      // with the `accessDeniedHeader` <h2> Gitako also renders on an API
      // failure (e.g. anonymous rate-limit) — both live under
      // `.gitako-side-bar`, so a bare `h2` match is ambiguous.
      title: '.gitako-side-bar h2.gitako-settings-bar-title',
      // Visible labels matched by text content; resolve to input ids
      // via DOM walking in test helpers.
      autoExpandLabel: 'Auto expand',
      copySnippetLabel: 'Copy snippet button',
      shortcutToggleSidebarLabel: 'Keyboard shortcut for toggle sidebar',
      shortcutFocusSearchLabel: 'Keyboard shortcut for focus search input',
      togglePinMode: '[aria-label="Toggle sidebar dock mode between float and persistent"]',
      // Buttons scoped to the sidebar so we don't accidentally grab
      // GitHub's chrome.
      saveButton: '.gitako-side-bar button:has-text("Save"):not([disabled])',
      saveOrClearButton:
        '.gitako-side-bar button:has-text("Save"), .gitako-side-bar button:has-text("Clear")',
    },
  },
}
