export const selectors = {
  github: {
    breadcrumbFileName: `[data-testid="breadcrumbs-filename"]`,
    fileContent: 'textarea[aria-label="file content"]',
    commitLinks: `main .TimelineItem-body ol li > div:nth-child(1) a[href*="/commit/"]`,
    // assume title contains `.` is file item
    fileListItemFileLinks: `table[aria-labelledby="folders-and-files"] tr.react-directory-row td.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a[aria-label$="(File)"]`,
    fileListItemLinkOf: (name: string) =>
      `table[aria-labelledby="folders-and-files"] tr.react-directory-row td.react-directory-row-name-cell-large-screen .react-directory-filename-column .react-directory-truncate a[title="${name}"]`,
    commitSummary: 'div.commit',
    navBarItemIssues: 'a[data-selected-links^="repo_issues "]',
    navBarItemPulls: 'a[data-selected-links^="repo_pulls "]',
  },
  gitako: {
    fileItem: '.gitako-side-bar .files .node-item',
    fileItemOf: (path: string) => `.gitako-side-bar .files .node-item[title="${path}"]`,
    errorMessage: '#gitako-logo-mount-point .error-message',
    files: '.gitako-side-bar .files',
    bodyWrapper: '.gitako-side-bar .gitako-side-bar-body-wrapper',
  },
}
