export function $<E extends HTMLElement>(selector: string): E | null
export function $<R1>(selector: string, existCallback: (element: HTMLElement) => R1): R1 | null
export function $<R1, R2>(
  selector: string,
  existCallback: (element: HTMLElement) => R1,
  otherwise: () => R2,
): R1 | R2
export function $<E extends HTMLElement, R2>(
  selector: string,
  existCallback: undefined | null,
  otherwise: () => R2,
): E | R2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function $(selector: string, existCallback?: any, otherwise?: any) {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element) : element
  }
  return otherwise ? otherwise() : null
}
