import React from 'react'

import { withErrorLog } from "../analytics"

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
      withErrorLog(() => map.get(args[0])(...args.slice(1)))()
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
