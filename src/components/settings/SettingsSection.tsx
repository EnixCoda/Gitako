import * as React from 'react'
type Props = {
  title: React.ReactNode
}

export function SettingsSection({ title, children }: React.PropsWithChildren<Props>) {
  return (
    <div className={'settings-section'}>
      <h4>{title}</h4>
      {children}
    </div>
  )
}
