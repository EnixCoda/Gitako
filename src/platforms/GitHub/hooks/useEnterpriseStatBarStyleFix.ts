import { useEffect } from 'react'
import { $ } from 'utils/DOMHelper'
import * as DOMHelper from '../DOMHelper'
import { GitHub } from '../index'

// A dirty fix for putting Gitako components over GHE stat bar.
// In normal cases the styles should be set via react render function return value,
// but adding the logic for such uncommon case is not worth the maintenance cost.
export function useEnterpriseStatBarStyleFix() {
  useEffect(() => {
    if (GitHub.isEnterprise()) {
      const enterpriseStatHeaderElement = DOMHelper.selectEnterpriseStatHeader()
      const zIndex = parseInt(enterpriseStatHeaderElement?.style.zIndex || '0', 10)
      if (!isNaN(zIndex) && zIndex) {
        $('.gitako-toggle-show-button-wrapper', e => (e.style.zIndex = `${zIndex + 1}`))
        $('.gitako-side-bar-body-wrapper', e => (e.style.zIndex = `${zIndex + 1}`))
      }
    }
  }, [])
}
