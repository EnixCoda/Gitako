import { platform } from 'platforms'
import * as React from 'react'
import { useAfterRedirect } from 'utils/hooks/useFastRedirect'
import * as DOMHelper from '../DOMHelper'
import { GitHub } from '../index'

export function useGitHubAttachCopySnippetButton(copySnippetButton: boolean) {
  const attachCopySnippetButton = React.useCallback(
    function attachCopySnippetButton() {
      if (platform === GitHub && copySnippetButton) DOMHelper.attachCopySnippet()
    },
    [copySnippetButton],
  )
  React.useEffect(attachCopySnippetButton, [attachCopySnippetButton])
  useAfterRedirect(attachCopySnippetButton)
}
