import React from 'react'

const middlewares = []

export function addMiddleware(middleware) {
  if (typeof middleware !== 'function') return null
  const m = middleware.bind(null)
  middlewares.push(m)
  return function removeMiddleware() {
    const index = middlewares.indexOf(m)
    if (index === -1) return
    middlewares.splice(index, 1)
  }
}

function applyMiddlewares(method, args) {
  for(const middleware of middlewares) {
    [method = method, args = args] = middleware(method, args) || []
  }
  return [method, args]
}

function run([method, args]) {
  method.apply(null, args)
}

function link(instance, sources) {
  const wrappedMethods = {/* [keyof sources] -> wrappedMethods.method */}
  const map = new Map(/* sources.creator -> wrappedMethods.method */)

  Object.entries(sources).forEach(([key, createMethod]) => {
    const method = createMethod(dispatch)
    wrappedMethods[key] = method
    map.set(createMethod, method)
  })

  const sourcesValues = Object.values(sources)
  function dispatch(...args) {
    const isFromSource = sourcesValues.includes(args[0])
    if (isFromSource) {
      const [createMethod, ...otherArgs] = args
      const method = map.get(createMethod)
      run(applyMiddlewares(method, otherArgs))
    } else {
      // by doing so, no async updater is available anymore
      // luckily I don't need them :)
      let [updater, callback] = args
      if (typeof updater === 'function') {
        updater = updater(instance.state, instance.props)
      }
      instance.setState(updater, callback)
    }
  }

  return wrappedMethods
}

export default function connect(mapping) {
  return function linkComponent(ComponentClass) {
    return class AwesomeApp extends React.PureComponent {
      static displayName = `Driven${ComponentClass.name}`

      state = {}
      boundCore = link(this, mapping)

      render() {
        return <ComponentClass {...this.props} {...this.boundCore} {...this.state} />
      }
    }
  }
}
