import * as React from 'react'
import * as configsHelper from 'utils/configHelper'
import { Config } from 'utils/configHelper'

type Props = {}

type ContextShape = IO<Config, Partial<Config>>
export type ConfigsContextShape = ContextShape

export const ConfigsContext = React.createContext<ContextShape | null>(null)

export function ConfigsContextWrapper(props: React.PropsWithChildren<Props>) {
  const [configs, setConfigs] = React.useState<Config | null>(null)
  React.useEffect(() => {
    configsHelper.get().then(setConfigs)
  }, [])
  const onChange = React.useCallback(
    (updatedConfigs: Partial<Config>) => {
      const mergedConfigs = { ...configs, ...updatedConfigs } as Config
      configsHelper.set(mergedConfigs)
      setConfigs(mergedConfigs)
    },
    [configs, setConfigs],
  )
  if (configs === null) return null
  return (
    <ConfigsContext.Provider value={{ value: configs, onChange: onChange }}>
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
