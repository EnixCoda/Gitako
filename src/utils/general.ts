import { TreeNode } from './VisibleNodesGenerator'

export function pick<T>(source: T, keys: string[]): Partial<T> {
  if (keys && typeof keys === 'object') {
    return (Array.isArray(keys) ? keys : Object.keys(keys)).reduce(
      (copy, key) => {
        if (key in source) {
          copy[key as keyof T] = source[key as keyof T]
        }
        return copy
      },
      {} as Partial<T>,
    )
  }
  return {} as Partial<T>
}

export enum OperatingSystems {
  Windows = 'Windows',
  macOS = 'Macintosh',
  others = 'unknown',
}

export function detectOS(): OperatingSystems {
  const {
    navigator: { userAgent },
  } = window
  if (userAgent.indexOf(OperatingSystems.Windows) !== -1) return OperatingSystems.Windows
  else if (userAgent.indexOf(OperatingSystems.macOS) !== -1) return OperatingSystems.macOS
  return OperatingSystems.others
}

export function friendlyFormatShortcut(shortcut?: string) {
  if (!shortcut) return ''
  const OS = detectOS()
  if (OS === OperatingSystems.Windows) {
    return shortcut.replace(/meta/, 'win')
  } else if (OS === OperatingSystems.macOS) {
    return shortcut
      .replace(/meta/, '⌘')
      .replace(/ctrl/, '⌃')
      .replace(/shift/, '⇧')
      .replace(/alt/, '⌥')
      .toUpperCase()
  } else {
    return shortcut
  }
}

export function findNode(
  root: TreeNode,
  path: string[],
  callback?: (node: TreeNode) => void,
): TreeNode | undefined {
  if (Array.isArray(root.contents)) {
    for (const content of root.contents) {
      if (content.name === path[0]) {
        if (callback) callback(content)
        if (path.length === 1) return content
        return findNode(content, path.slice(1), callback)
      }
    }
  }
}
