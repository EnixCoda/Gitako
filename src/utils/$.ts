export function $(selector: string): HTMLElement | null
export function $<T1>(selector: string, existCallback: (element: HTMLElement) => T1): T1 | null
export function $<T1, T2>(
  selector: string,
  existCallback: (element: HTMLElement) => T1,
  otherwise: () => T2,
): T1 | T2
export function $<T2>(
  selector: string,
  existCallback: undefined | null,
  otherwise: () => T2,
): HTMLElement | T2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function $(selector: string, existCallback?: any, otherwise?: any) {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element) : element
  }
  return otherwise ? otherwise() : null
}
