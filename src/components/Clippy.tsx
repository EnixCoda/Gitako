import * as React from 'react'
import { cx } from 'utils/cx'
import { copyElementContent } from 'utils/DOMHelper'

type Props = {
  codeSnippetElement: Element
}

const className = 'clippy-wrapper'
export const ClippyClassName = className

export function Clippy({ codeSnippetElement }: Props) {
  const [status, setStatus] = React.useState<'normal' | 'success' | 'fail'>('normal')
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus('normal')
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [status])

  const onClippyClick = React.useCallback(function onClippyClick() {
    if (copyElementContent(codeSnippetElement)) {
      setStatus('success')
    } else {
      setStatus('fail')
    }
  }, [])

  return (
    <div className={className}>
      <button className="clippy" onClick={onClippyClick}>
        <i className={cx('icon', status)} />
      </button>
    </div>
  )
}
