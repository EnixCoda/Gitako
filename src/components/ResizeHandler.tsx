import Icon from 'components/Icon'
import * as React from 'react'
import { Size } from './Resizable'

type Props = {
  size: Size
  onResize(size: Size): void
  style?: React.CSSProperties
}

export default class HorizontalResizeHandler extends React.PureComponent<Props> {
  pointerDown = false
  startX = 0
  baseSize = this.props.size

  componentWillReceiveProps(nextProps: Props) {
    if (!this.pointerDown) {
      // update baseSize when not resizing
      this.baseSize = nextProps.size
    }
  }

  subscribeEvents = () => {
    window.addEventListener('mousemove', this.onPointerMove)
    window.addEventListener('mouseup', this.onPointerUp)
  }

  unsubscribeEvents = () => {
    window.removeEventListener('mousemove', this.onPointerMove)
    window.removeEventListener('mouseup', this.onPointerUp)
  }

  onPointerDown = ({ clientX }: React.MouseEvent) => {
    this.startX = clientX
    this.pointerDown = true
    this.subscribeEvents()
  }

  onPointerMove = ({ clientX }: MouseEvent) => {
    if (!this.pointerDown) return
    this.props.onResize(clientX - this.startX + this.baseSize)
  }

  onPointerUp = () => {
    this.pointerDown = false
    this.baseSize = this.props.size
    this.unsubscribeEvents()
  }

  render() {
    const { style } = this.props
    return (
      <div className={'gitako-resize-handler'} onMouseDown={this.onPointerDown} style={style}>
        <Icon type={'grabber'} className={'grabber-icon'} />
      </div>
    )
  }
}
