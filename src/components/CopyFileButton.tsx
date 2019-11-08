import * as React from 'react'
import { copyElementContent, getCodeElement } from 'utils/DOMHelper'

type Props = {}

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
      className="btn btn-sm BtnGroup-item copy-file-btn"
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
