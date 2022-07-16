import * as React from 'react'
import * as DOMHelper from 'utils/DOMHelper'

export function useFocusFileExplorerOnFirstRender() {
  React.useEffect(() => {
    DOMHelper.focusFileExplorer()
  }, [])
}
