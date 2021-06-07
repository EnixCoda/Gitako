import { platform } from 'platforms'
import * as React from 'react'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import * as DOMHelper from '../DOMHelper'
import { GitHub } from '../index'

export function useGitHubAttachCopySnippetButton(copySnippetButton: boolean) {
  const attachCopySnippetButton = React.useCallback(
    function attachCopySnippetButton() {
      if (platform !== GitHub) return
      if (copySnippetButton) return DOMHelper.attachCopySnippet() || undefined // for the sake of react effect
    },
    [copySnippetButton],
  )
  React.useEffect(attachCopySnippetButton, [copySnippetButton])
  useOnPJAXDone(attachCopySnippetButton)
}
