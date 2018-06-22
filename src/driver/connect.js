import React from 'react'

function isObject(target) {
  return typeof target === 'object' && target !== null
}

function link(instance, sources) {
  const wrappedMethods = {/* sources[key] -> wrappedMethods.method */}
  const map = new Map(/* sources.creator -> wrappedMethods.method */)

  function dispatch(...args) {
    if (Object.values(sources).includes(args[0])) {
      map.get(args[0])(...args.slice(1))
    } else {
      setTimeout(
        instance.setState.bind(instance, ...args),
      )
    }
  }

  Object.entries(sources).forEach(([key, createMethod]) => {
    const method = createMethod(dispatch)
    wrappedMethods[key] = method
    map.set(createMethod, method)
  })

  return wrappedMethods
}

export default function connect(mapping) {
  return function linkComponent(ComponentClass) {
    return class AwesomeApp extends React.PureComponent {
      static displayName = `Driven${ComponentClass.name}`

      state = {}
      boundCore = link(this, mapping)

      render() {
        return (
          <ComponentClass {...this.props} {...this.boundCore} {...this.state}/>
        )
      }
    }
  }
}
