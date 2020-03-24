import * as NProgress from 'nprogress'
import * as React from 'react'

export function useProgressBar() {
  const [progressBar] = React.useState(() => {
    return {
      mount() {
        NProgress.start()
      },

      unmount() {
        NProgress.done()
      },
    }
  })

  React.useEffect(() => {
    NProgress.configure({ showSpinner: false })
  }, [])

  return progressBar
}
