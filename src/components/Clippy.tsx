import * as React from 'react'
import { cx } from 'utils/cx'
import { copyElementContent } from 'utils/DOMHelper'

type Props = {
  codeSnippetElement: Element
}

const className = 'clippy-wrapper'
export const ClippyClassName = className

export function Clippy({ codeSnippetElement }: Props) {
  const [state, setState] = React.useState<'normal' | 'success' | 'fail'>('normal')
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setState('normal')
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [state])

  // Temporary fix:
  // React moved root node of event delegation since v17
  // onClick on <a /> won't work when rendered with `renderReact`
  const elementRef = React.useRef<HTMLButtonElement | null>(null)
  React.useEffect(() => {
    const element = elementRef.current
    if (element) {
      function onClippyClick() {
        setState(copyElementContent(codeSnippetElement) ? 'success' : 'fail')
      }
      element.addEventListener('click', onClippyClick)
      return () => element.removeEventListener('click', onClippyClick)
    }
  }, [])

  return (
    <div className={className}>
      <button className="clippy" ref={elementRef}>
        <i className={cx('icon', state)} />
      </button>
    </div>
  )
}
