type CXValue = string | boolean | null | undefined

/**
 * cx('class1', { class2: true, class3: false }) --> 'class1 class2'
 */
export function cx(
  ...classNames: (
    | CXValue
    | {
        [className: string]: CXValue
      }
  )[]
): string {
  return classNames.map(handleClassName).filter(Boolean).join(' ')
}

function handleClassName(className: Parameters<typeof cx>[number]): string | false {
  switch (typeof className) {
    case 'string':
      return className
    case 'object':
      return className === null
        ? false
        : cx(...Object.entries(className).map(([key, value]) => (value ? key : false)))
    default:
      return false
  }
}
