import { useLayoutEffect } from 'react'

export function useCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement,
) {
  useLayoutEffect(() => {
    element.style.setProperty(name, value)
  }, [name, value, element])
}
