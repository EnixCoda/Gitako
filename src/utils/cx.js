/**
 * cx('class1', { class2: true, class3: false }) --> 'class1 class2'
 * @param {string} baseClassNames 
 * @param {object} optionalClassNames 
 */
export default function cx(baseClassNames = '', optionalClassNames = {}) {
  return Object.entries(optionalClassNames)
    .map(([key, value]) => value ? key : '')
    .filter(_ => _)
    .concat([baseClassNames])
    .join(' ')
}
