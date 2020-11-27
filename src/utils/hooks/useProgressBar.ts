import * as NProgress from 'nprogress'
import * as React from 'react'
import { useEvent } from 'react-use'

const progressBar = {
  mount() {
    NProgress.start()
  },
  unmount() {
    NProgress.done()
  },
}

export function useProgressBar() {
  React.useEffect(() => {
    NProgress.configure({ showSpinner: false })
  }, [])

  useEvent('pjax:start', progressBar.mount, window)
  useEvent('pjax:unload', progressBar.unmount, window)
}
