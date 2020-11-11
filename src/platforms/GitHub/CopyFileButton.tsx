import * as React from 'react'
import { cx } from 'utils/cx'
import { copyElementContent } from 'utils/DOMHelper'
import { getCodeElement } from './DOMHelper'

type Props = {}

const className = 'gitako-copy-file-button'
export const copyFileButtonClassName = className

const contents = {
  success: 'Success!',
  error: 'Copy failed!',
  normal: 'Copy file',
}
export function CopyFileButton(props: React.PropsWithChildren<Props>) {
  const [content, setContent] = React.useState(contents.normal)
  React.useEffect(() => {
    if (content !== contents.normal) {
      const timer = setTimeout(() => {
        setContent(contents.normal)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [content])

  const elementRef = React.useRef<HTMLAnchorElement | null>(null)
  React.useEffect(() => {
    // Temporary fix:
    // React moved root node of event delegation since v17
    // onClick on <a /> won't work when rendered with `renderReact`
    const element = elementRef.current
    if (element) {
      function copyCode() {
        const codeElement = getCodeElement()
        if (codeElement) {
          setContent(copyElementContent(codeElement) ? contents.success : contents.error)
        }
      }
      element.addEventListener('click', copyCode)
      return () => element.removeEventListener('click', copyCode)
    }
  }, [])

  return (
    <a ref={elementRef} className={cx('btn btn-sm BtnGroup-item copy-file-btn', className)}>
      {content}
    </a>
  )
}
