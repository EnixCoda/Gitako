import * as NProgress from 'nprogress'
import { platform } from 'platforms'
import { GitHub } from 'platforms/GitHub'
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

const isGitHub = platform === GitHub
// use native progress bar on GitHub
export const useProgressBar = isGitHub
  ? function () {}
  : function useProgressBar() {
      React.useEffect(() => {
        NProgress.configure({ showSpinner: false })
      }, [])
      useEvent('pjax:fetch', progressBar.mount, window)
      useEvent('pjax:unload', progressBar.unmount, window)
    }
