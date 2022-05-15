/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { fuzzyMode } from './fuzzyMode'

type TreeNodeSource = {
  [key: string]: true | TreeNodeSource
}

function createTreeNode(source: TreeNodeSource, name = '', paths: string[] = []): TreeNode {
  const subPaths = paths.concat(name)
  return {
    name,
    path: subPaths.join('/'),
    type: 'tree',
    contents: Object.entries(source).map(([key, value]) => {
      return value === true
        ? {
            name: key,
            path: subPaths.concat(key).join('/'),
            type: 'blob',
          }
        : createTreeNode(value, key, subPaths)
    }),
  }
}

const node = createTreeNode({
  a: {
    b: {
      ['c.json']: true,
    },
  },
})

it(`finds the items that matches all search key chars`, () => {
  // a/b/c.json
  // "b" =>
  //     ✅a/b
  //     ❌a
  expect(fuzzyMode.getSearchParams('b')?.matchNode(node.contents?.[0].contents?.[0]!)).toBe(true)
  expect(fuzzyMode.getSearchParams('b')?.matchNode(node.contents?.[0]!)).toBe(false)
})

it(`excludes files under the dir that matches last search key char`, () => {
  // a/b/c.json
  // "b" =>
  //     ❌a/b/c.json
  expect(
    fuzzyMode.getSearchParams('b')?.matchNode(node.contents?.[0].contents?.[0].contents?.[0]!),
  ).toBe(false)
  expect(
    fuzzyMode.getSearchParams('tooltip')?.matchNode({
      name: '',
      type: 'tree',
      path: '/components/tooltip',
    }),
  ).toBe(true)
  expect(
    fuzzyMode.getSearchParams('tooltip')?.matchNode({
      name: '',
      type: 'blob',
      path: '/components/tooltip/x',
    }),
  ).toBe(false)
  expect(
    fuzzyMode.getSearchParams('tooltip/')?.matchNode({
      name: '',
      type: 'blob',
      path: '/components/tooltip/x',
    }),
  ).toBe(true)
})
