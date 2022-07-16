import { platform } from 'platforms'
import * as React from 'react'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import * as DOMHelper from '../DOMHelper'
import { GitHub } from '../index'

export function useGitHubAttachCopyFileButton(copyFileButton: boolean) {
  const attachCopyFileButton = React.useCallback(
    function attachCopyFileButton() {
      if (platform === GitHub && copyFileButton) DOMHelper.attachCopyFileBtn()
    },
    [copyFileButton],
  )
  React.useEffect(attachCopyFileButton, [attachCopyFileButton])
  useAfterRedirect(attachCopyFileButton)
}
