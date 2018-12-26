import React from 'react'
import Icon from 'components/Icon'

export default class ResizeHandler extends React.PureComponent {
  pointerDown = false
  startX = 0
  delta = 0
  baseSize = this.props.size

  subscribeEvents = () => {
    window.addEventListener('mousemove', this.onPointerMove)
    window.addEventListener('mouseup', this.onPointerUp)
  }

  unsubscribeEvents = () => {
    window.removeEventListener('mousemove', this.onPointerMove)
    window.removeEventListener('mouseup', this.onPointerUp)
  }

  /**
   *
   * @param {MouseEvent} e
   * @memberof ResizeHandler
   */
  onPointerDown = e => {
    this.pointerDown = true
    const { clientX } = e
    this.startX = clientX
    this.subscribeEvents()
  }

  onPointerMove = e => {
    if (!this.pointerDown) return
    const { clientX } = e
    const { onResize } = this.props
    this.delta = this.startX - clientX
    onResize(this.delta + this.baseSize)
  }

  onPointerUp = () => {
    this.pointerDown = false
    this.baseSize = Math.max(this.baseSize + this.delta, this.props.size)
    this.unsubscribeEvents()
  }

  render() {
    const { style } = this.props
    return (
      <div
        className={'gitako-resize-handler'}
        onMouseDown={this.onPointerDown}
        style={style}
      >
        <Icon type={'grabber'} className={'grabber-icon'} />
      </div>
    )
  }
}
