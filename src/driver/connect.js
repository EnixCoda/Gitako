import React from 'react'

export default function connect(core) {
  return function linkComponent(ComponentClass) {
    return class AwesomeApp extends React.PureComponent {
      static displayName = `Driven${ComponentClass.name}`

      state = {}
      boundCore = core(this)

      render() {
        return (
          <ComponentClass {...this.boundCore} {...this.state} />
        )
      }
    }
  }
}
