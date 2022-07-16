import { useLayoutEffect } from 'react'
import { setCSSVariable } from 'utils/DOMHelper'

export function useCSSVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement,
) {
  useLayoutEffect(() => {
    setCSSVariable(name, value, element)
  }, [name, value, element])
}
