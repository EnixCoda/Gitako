/**
 * cx('class1', { class2: true, class3: false }) --> 'class1 class2'
 */
export default function cx(...classNames: (string | object)[]): string {
  return classNames
    .filter(Boolean)
    .map(className => {
      switch (typeof className) {
        case 'string':
          return className
        case 'object':
          return cx(
            ...Object.entries(className).map(([key, value]) => (Boolean(value) ? key : null))
          )
        default:
          return ''
      }
    })
    .join(' ')
}
