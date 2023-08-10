import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { useEvent, useInterval } from 'react-use'

const config: import('pjax-api').Config = {
  areas: [
    // github
    '.repository-content',
    // gitee
    '#git-project-content',
    // gitea
    '.repository > .ui.container',
  ],
  update: {
    css: false,
  },
  fetch: {
    cache(path) {
      return path
    },
  },
  link: 'a:not(a)', // this helps fixing the go-back-in-history issue
  form: 'form:not(form)', // prevent blocking form submissions
  fallback(/* target, reason */) {
    // prevent unexpected reload
  },
}

export function usePJAXAPI() {
  const { pjaxMode } = useConfigs().value
  // make history travel work
  React.useEffect(() => {
    if (pjaxMode === 'pjax-api') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Pjax } = require('pjax-api')
      new Pjax({
        ...config,
        filter() {
          return false
        },
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // bindings for legacy support
  useRedirectedEvents(window, 'pjax:fetch', 'pjax:start', document)
  useRedirectedEvents(document, 'pjax:ready', 'pjax:end')
}

export const loadWithFastRedirect = (url: string, element: HTMLElement) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  platform.loadWithFastRedirect?.(url, element) || require('pjax-api').Pjax.assign(url, config)
}

export function useAfterRedirect(callback: () => void) {
  const latestHref = React.useRef(location.href)
  const raceCallback = React.useCallback(() => {
    const { href } = location
    if (latestHref.current !== href) {
      latestHref.current = href
      callback()
    }
  }, [callback])
  useInterval(raceCallback, 500)
  useEvent('pjax:end', raceCallback, document) // legacy support
  useEvent('turbo:render', raceCallback, document) // prevent page content shift after first redirect to new page via turbo when sidebar is pinned
}

export function useRedirectedEvents(
  originalTarget: Window | Document | Element,
  originalEvent: string,
  redirectedEvent: string,
  redirectToTarget = originalTarget,
) {
  useEvent(
    originalEvent,
    () => {
      redirectToTarget.dispatchEvent(new Event(redirectedEvent))
    },
    originalTarget,
  )
}
