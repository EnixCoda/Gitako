import * as React from 'react'
import ResizeHandler from 'components/ResizeHandler'
import cx from 'utils/cx'

export type Size = number
type Props = {
  baseSize: Size
  className?: string
}

export default class Resizable extends React.PureComponent<Props> {
  state = {
    size: this.props.baseSize,
  }

  onResize = (size: Size) => this.setState({ size: Math.max(this.props.baseSize, size) })

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
