import { platform } from 'platforms'
import * as React from 'react'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
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
  useOnPJAXDone(attachCopySnippetButton)
}
