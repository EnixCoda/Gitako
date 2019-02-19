import * as React from 'react'

export type ParametersOfReturnedFunction<Func> = Func extends (<Args extends []>(
  ...args1: any[] // it's ok
) => (...args2: Args) => any) // it's ok
  ? Args
  : never

export type Method = (...args: Args) => void | Promise<void>
type Args = any[] // it's ok
export type Middleware = <M extends Method, MM extends Method>(
  method: M,
  args: Parameters<M>
) => [MM | M, Parameters<MM | M>]

const middlewares: Middleware[] = []

export function addMiddleware(middleware: Middleware) {
  if (typeof middleware !== 'function') return null
  const m = middleware.bind(null)
  middlewares.push(m)
  return function removeMiddleware() {
    const index = middlewares.indexOf(m)
    if (index === -1) return
    middlewares.splice(index, 1)
  }
}

const applyMiddlewares: Middleware = function applyMiddlewares(method, args) {
  for (const middleware of middlewares) {
    ;[method = method, args = args] = middleware(method, args)
  }
  return [method, args]
}

function run<M extends Method>([method, args]: [M, Parameters<M>]) {
  method.apply(null, args)
}

export type DispatchState<Props, State> = React.Component<Props, State>['setState']
export type PreDispatch<Props, State> = (
  dispatchCallback: (state: State, props: Props) => Props | Promise<void> | void,
  callback?: () => void
) => void
export type TriggerOtherMethod = <MC extends MethodCreator<any, any>>(
  methodCreator: MC,
  ...args: ParametersOfReturnedFunction<MC>
) => void

export type Dispatch<Props, State> = {
  set: DispatchState<Props, State>
  get: PreDispatch<Props, State>
  call: TriggerOtherMethod
}

export type MethodCreator<Props, State> = (dispatch: Dispatch<Props, State>) => Method

type Sources = {
  [key: string]: MethodCreator<any, any>
}
type WrappedMethods = {
  [key: string]: Method
}

function link<P, S>(instance: React.Component<P, S>, sources: Sources): WrappedMethods {
  const wrappedMethods: WrappedMethods = {
    /* [keyof sources] -> wrappedMethods.method */
  }
  const map = new Map<MethodCreator<P, S>, Method>(/* sources.creator -> wrappedMethods.method */)

  const dispatchCall: TriggerOtherMethod = (createMethod, ...otherArgs) => {
    const isFromSource = sourcesValues.includes(createMethod)
    if (isFromSource) {
      const method = map.get(createMethod)
      const runnable = applyMiddlewares(method, otherArgs)
      run(runnable)
    }
  }
  const dispatchState: DispatchState<P, S> = (updater, callback) => {
    instance.setState(updater, callback)
  }
  const prepareState: PreDispatch<P, S> = updater => {
    updater(instance.state, instance.props)
  }
  const dispatch: Dispatch<P, S> = {
    call: dispatchCall,
    get: prepareState,
    set: dispatchState,
  }

  Object.entries(sources).forEach(([key, createMethod]) => {
    const method = createMethod(dispatch)
    wrappedMethods[key] = method
    map.set(createMethod, method)
  })

  const sourcesValues = Object.values(sources)

  return wrappedMethods
}

export default function connect<BaseP, ExtraP>(mapping: Sources) {
  return function linkComponent<S>(
    ComponentClass: React.ComponentClass<BaseP & ExtraP, S>
  ): React.ComponentClass<BaseP, ExtraP> {
    return class AwesomeApp extends React.PureComponent<BaseP, ExtraP> {
      static displayName = `Connected(${ComponentClass.displayName || ComponentClass.name})`
      static defaultProps = ComponentClass.defaultProps

      state = {} as ExtraP
      connectedMethods = link<BaseP, ExtraP>(this, mapping) as WrappedMethods

      render() {
        const props = Object.assign({}, this.props, this.connectedMethods, this.state)
        return React.createElement(ComponentClass, props)
      }
    }
  }
}
