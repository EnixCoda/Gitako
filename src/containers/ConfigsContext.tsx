import * as React from 'react'
import { Config, configHelper } from 'utils/config/helper'

type Props = {}

type ContextShape = IO<Config, Partial<Config>>
export type ConfigsContextShape = ContextShape

export const ConfigsContext = React.createContext<ContextShape | null>(null)

export function ConfigsContextWrapper(props: React.PropsWithChildren<Props>) {
  const [configs, setConfigs] = React.useState<Config | null>(null)
  React.useEffect(() => {
    configHelper.get().then(setConfigs)
  }, [])

  const everUpdatedRef = React.useRef(false)
  React.useEffect(() => {
    if (everUpdatedRef.current && configs) configHelper.set(configs)
  }, [configs])
  const onChange = React.useCallback(
    (updatedConfigs: Partial<Config>) => {
      everUpdatedRef.current = true
      setConfigs(configs => (configs ? { ...configs, ...updatedConfigs } : configs))
    },
    [setConfigs],
  )

  if (configs === null) return null

  return (
    <ConfigsContext.Provider value={{ value: configs, onChange }}>
      {props.children}
    </ConfigsContext.Provider>
  )
}

export const useConfigs = useNonNullContext(ConfigsContext)

function useNonNullContext<T>(theContext: React.Context<T | null>): () => T {
  return () => {
    const context = React.useContext(theContext)
    if (context === null) throw new Error(`Empty context`)
    return context
  }
}
