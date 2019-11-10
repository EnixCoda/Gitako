import * as React from 'react'

export type Method<Args extends any[] = any[]> = (...args: Args) => void | Promise<void>
export type Middleware = <M extends Method, MM extends Method>(
  method: M,
  args: Parameters<M>,
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
export type GetState<Props, State> = () => [State, Props]
export type TriggerOtherMethod<Props, State> = <Args extends any[]>(
  methodCreator: MethodCreator<Props, State, Args>,
  ...args: Parameters<ReturnType<MethodCreator<Props, State, Args>>>
) => void

export type Dispatch<Props, State> = {
  set: DispatchState<Props, State>
  get: GetState<Props, State>
  call: TriggerOtherMethod<Props, State>
}

export type MethodCreator<Props, State, Args extends any[] = []> = (
  dispatch: Dispatch<Props, State>,
) => Method<Args>

export type Sources<P, S> = {
  [key: string]: MethodCreator<P, S, any>
}
type WrappedMethods = {
  [key: string]: Method
}

function link<P, S>(instance: React.Component<P, S>, sources: Sources<P, S>): WrappedMethods {
  const wrappedMethods: WrappedMethods = {
    /* [keyof sources] -> wrappedMethods.method */
  }
  const map = new Map<
    MethodCreator<P, S, any>,
    Method
  >(/* sources.creator -> wrappedMethods.method */)

  const dispatchCall: TriggerOtherMethod<P, S> = (createMethod, ...otherArgs) => {
    const isFromSource = sourcesValues.includes(createMethod)
    if (isFromSource) {
      const method = map.get(createMethod)
      if (!method) throw new Error('Method not found')
      const runnable = applyMiddlewares(method, otherArgs)
      run(runnable)
    }
  }
  const dispatchState: DispatchState<P, S> = (updater, callback) => {
    instance.setState(updater, callback)
  }
  const prepareState: GetState<P, S> = () => [instance.state, instance.props]
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

export function connect<BaseP, ExtraP>(mapping: Sources<BaseP, ExtraP>) {
  return function linkComponent<
    State,
    ComponentClass extends React.ComponentClass<BaseP & ExtraP, State>
  >(Component: ComponentClass) {
    return class ConnectedComponent extends React.PureComponent<BaseP, ExtraP, State> {
      static displayName = `Connected(${Component.displayName || Component.name})`
      static defaultProps = Component.defaultProps

      state: ExtraP = {} as ExtraP
      connectedMethods: WrappedMethods = link<BaseP, ExtraP>(this, mapping)

      render() {
        const props = Object.assign({}, this.props, this.connectedMethods, this.state)
        return React.createElement(Component, props)
      }
    }
  }
}

export type GetCreatedMethod<MC> = MC extends MethodCreator<infer P, infer S, infer Args>
  ? Args extends any[]
    ? ((...args: Args) => void)
    : never
  : never
