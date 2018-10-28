import React from 'react'
import PropTypes from 'prop-types'
import ResizeHandler from 'components/ResizeHandler'
import cx from 'utils/cx';

export default class Resizable extends React.PureComponent {
  static propTypes = {
    baseSize: PropTypes.number.isRequired,
  }

  state = {
    size: this.props.baseSize,
  }

  onResize = size => this.setState({ size: Math.max(this.props.baseSize, size) })

  render() {
    const { className, children } = this.props
    const { size } = this.state
    return (
      <div className={cx('gitako-position-wrapper', className)}>
        <ResizeHandler onResize={this.onResize} size={size} />
        <div className={'gitako-position-content'} style={{ width: size }}>
          {children}
        </div>
      </div>
    )
  }
}
