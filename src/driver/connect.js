import React from 'react'

import { withErrorLog } from "../analytics"

function async(func) {
  return new Promise(resolve => setTimeout(() => resolve(func())))
}

function sync(func) {
  return func()
}

function link(instance, sources) {
  const wrappedMethods = {/* [keyof sources] -> wrappedMethods.method */}
  const map = new Map(/* sources.creator -> wrappedMethods.method */)


  Object.entries(sources).forEach(([key, createMethod]) => {
    const method = createMethod(dispatch)
    wrappedMethods[key] = method
    map.set(createMethod, method)
  })

  function dispatch(...args) {
    const isFromSource = Object.values(sources).includes(args[0])
    if (isFromSource) {
      sync(withErrorLog(() => map.get(args[0])(...args.slice(1))))
    } else {
      async(() => instance.setState(...args))
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
