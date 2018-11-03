import React from 'react'
import PropTypes from 'prop-types'

export default class AutoSizer extends React.Component {
  static propTypes = {}

  static defaultProps = {}

  state = {
    size: {
      width: 0,
      height: 0,
    },
  }

  ref = React.createRef()

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
