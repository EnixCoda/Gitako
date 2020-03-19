import * as React from 'react'
type Props = {
  title?: React.ReactNode
}

export function SettingsSection({ title, children }: React.PropsWithChildren<Props>) {
  return (
    <div className={'settings-section'}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
