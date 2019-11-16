import * as React from 'react'
import { cx } from 'utils/cx'
import { copyElementContent, getCodeElement } from 'utils/DOMHelper'

type Props = {}

const className = 'gitako-copy-file-button'
export const copyFileButtonClassName = className

export function CopyFileButton(props: React.PropsWithChildren<Props>) {
  const contents = {
    success: 'Success!',
    error: 'Copy failed!',
    normal: 'Copy file',
  }
  const [content, setContent] = React.useState(contents.normal)
  React.useEffect(() => {
    if (content !== contents.normal) {
      const timer = setTimeout(() => {
        setContent(contents.normal)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [content])
  return (
    <a
      className={cx('btn btn-sm BtnGroup-item copy-file-btn', className)}
      onClick={() => {
        const codeElement = getCodeElement()
        if (codeElement) {
          if (copyElementContent(codeElement)) {
            setContent(contents.success)
          } else {
            setContent(contents.error)
          }
        }
      }}
    >
      {content}
    </a>
  )
}
