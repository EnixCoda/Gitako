import { isOpenInNewWindowClick } from './general'
import { loadWithFastRedirect } from './hooks/useFastRedirect'

export function createAnchorClickHandler(url: string) {
  return (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isOpenInNewWindowClick(e)) return

    e.preventDefault()
    loadWithFastRedirect(url, e.currentTarget)
  }
}
