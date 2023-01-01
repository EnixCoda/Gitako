import { Size } from '../components/Size'

export const MINIMAL_CONTENT_VIEWPORT_WIDTH = 100
export const MINIMAL_WIDTH = 240

export function getSafeWidth(width: Size, windowWidth: number) {
  // if window width is too small, prevent reducing anymore
  if (windowWidth < MINIMAL_WIDTH + MINIMAL_CONTENT_VIEWPORT_WIDTH) return MINIMAL_WIDTH
  // if trying to enlarge to much, leave some space
  if (width > windowWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH)
    return windowWidth - MINIMAL_CONTENT_VIEWPORT_WIDTH
  if (width < MINIMAL_WIDTH) return MINIMAL_WIDTH
  return width
}
