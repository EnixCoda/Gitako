import React from 'react'

export default function(core) {
  return function(ComponentClass) {
    return class Driven extends React.PureComponent {
      static displayName = `Driven${ComponentClass.name}`

      state = {}
      dispatch = this.setState.bind(this)
      boundCore = core(this.dispatch)

      render() {
        return (
          <ComponentClass {...this.boundCore} {...this.state} />
        )
      }
    }
  }
}
