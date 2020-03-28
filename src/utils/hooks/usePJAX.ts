import * as PJAX from 'pjax'
import * as React from 'react'
import { useProgressBar } from './useProgressBar'

export function usePJAX() {
  // Note: shall not enable below pjax:send listener as there would be dual bar when GitHub PJAX links are triggered
  // window.addEventListener('pjax:send', () => mountTopProgressBar())
  const [pjax] = React.useState(
    () =>
      new PJAX({
        elements: 'match-nothing-selector',
        selectors: [
          '.repository-content',
          'title',
          '[data-pjax="#js-repo-pjax-container"]',
          '.page-content',
          '#git-project-content',
        ],
        scrollTo: false,
        analytics: false,
        cacheBust: false,
        forceCache: true, // TODO: merge namespace, add forceCache
      }),
  )
  const progressBar = useProgressBar()
  React.useEffect(() => {
    window.addEventListener('pjax:complete', progressBar.unmount)
    return () => window.removeEventListener('pjax:complete', progressBar.unmount)
  }, [])

  const loadWithPJAX = React.useCallback(
    function loadWithPJAX(URL: string) {
      progressBar.mount()
      pjax.loadUrl(URL, { scrollTo: 0 })
    },
    [pjax],
  )

  return loadWithPJAX
}
