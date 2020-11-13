import { Config, Pjax } from 'pjax-api'
import * as React from 'react'
import { useEvent } from 'react-use'
import { useProgressBar } from './useProgressBar'

const config: Config = {
  areas: [
    // github
    '.repository-content',
    '[data-pjax="#js-repo-pjax-container"]',
    '.page-content',
    // gitee
    '#git-project-content',
  ],
  update: {
    css: false,
  },
  fetch: {
    cache(path) {
      return path
    },
  },
  form: 'form:not(form)', // prevent blocking form submissions
  fallback(target, reason) {
    // prevent unexpected reload
  },
}

export function usePJAX() {
  // make history travel work
  React.useEffect(() => {
    new Pjax({
      ...config,
      filter() {
        return false
      },
    })
  }, [])

  const progressBar = useProgressBar()
  useEvent('pjax:fetch', progressBar.mount, window)
  useEvent('pjax:unload', progressBar.unmount, window)

  return React.useCallback(url => {
    Pjax.assign(url, config)
  }, [])
}

export function useOnPJAXDone(callback: () => void, both = true) {
  useEvent('pjax:ready', callback, document)
  if (both) useEvent('pjax:end', callback, document) // emit by GitHub
}
