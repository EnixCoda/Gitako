import * as React from 'react'
import { noop } from 'utils/general'

export type ReloadContextShape = () => void

export const ReloadContext = React.createContext<ReloadContextShape>(noop)

export function ReloadContextWrapper({ children }: React.PropsWithChildren<{}>) {
  const [key, setKey] = React.useState(0)
  const reload = React.useCallback(() => setKey(key => key + 1), [])

  return (
    <ReloadContext.Provider key={key} value={reload}>
      {children}
    </ReloadContext.Provider>
  )
}
