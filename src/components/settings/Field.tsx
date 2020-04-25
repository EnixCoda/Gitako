import * as React from 'react'
import { cx } from 'utils/cx'

type Props = {
  id?: string
  className?: string
  checkbox?: boolean
  title?: React.ReactNode
}

export function Field({
  className,
  title,
  id,
  checkbox,
  children,
}: React.PropsWithChildren<Props>) {
  return (
    <div className={cx('field', className)}>
      {checkbox ? (
        <>
          {children}
          {title && <label htmlFor={id}>{title}</label>}
        </>
      ) : (
        <>
          {title && <label htmlFor={id}>{title}</label>}
          <div>{children}</div>
        </>
      )}
    </div>
  )
}
