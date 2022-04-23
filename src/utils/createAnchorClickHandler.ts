import { isOpenInNewWindowClick } from './general'
import { loadWithPJAX } from './hooks/usePJAX'

export function createAnchorClickHandler(url: string) {
  return (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isOpenInNewWindowClick(e)) return

    e.preventDefault()
    loadWithPJAX(url, e.currentTarget)
  }
}
