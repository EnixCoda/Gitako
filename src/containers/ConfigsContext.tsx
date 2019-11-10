import * as React from 'react'
import { Config, getAll, setAll } from 'utils/configHelper'

type Props = {}

type ContextShape = PartialValSet<Config>

const ConfigsContext = React.createContext<ContextShape | null>(null)

export function ConfigsContextWrapper(props: React.PropsWithChildren<Props>) {
  const [configs, setConfigs] = React.useState<Config | null>(null)
  React.useEffect(() => {
    getAll().then(setConfigs)
  }, [])
  const set = React.useCallback(
    () => (configs: Config) => {
      setAll(configs)
      setConfigs(configs)
    },
    [setConfigs],
  )
  if (configs === null) return null
  return (
    <ConfigsContext.Provider value={{ val: configs, set }}>
      {props.children}
    </ConfigsContext.Provider>
  )
}

export const useConfigs = useNonNullContext(ConfigsContext)

function useNonNullContext<T, R extends Exclude<T, null>>(theContext: React.Context<T>): () => R {
  return () => {
    const context = React.useContext(theContext)
    if (context === null) throw new Error(`Empty context`)
    return context as R
  }
}
