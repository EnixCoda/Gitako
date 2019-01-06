import * as React from 'react'

type Props = {
  children(size: Size): React.ReactNode
}

type Size = {
  width: number
  height: number
}

type State = {
  size: Size
}

export default class AutoSizer extends React.Component<Props, State> {
  state = {
    size: {
      width: 0,
      height: 0,
    },
  }

  ref = React.createRef<HTMLDivElement>()

  componentDidMount() {
    const container = this.ref.current
    if (container) {
      this.setState({
        size: {
          width: container.offsetWidth,
          height: container.offsetHeight,
        },
      })
    }
  }

  render() {
    const { size } = this.state
    return (
      <div {...this.props} ref={this.ref}>
        {this.props.children(size)}
      </div>
    )
  }
}
