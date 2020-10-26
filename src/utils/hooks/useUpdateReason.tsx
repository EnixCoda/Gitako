import { IN_PRODUCTION_MODE } from 'env'
import * as React from 'react'

export function useUpdateReason<P /* extends {
  [key: string]: any
} */>(props: P) {
  const lastPropsRef = React.useRef<P>(props)
  React.useEffect(() => {
    if (IN_PRODUCTION_MODE) return
    let output: unknown[][] = []
    for (const key of Object.keys(props)) {
      if (key === 'children') continue
      const $key = key as keyof P
      if (!(key in lastPropsRef.current)) output.push([`[Added]`, key, props[$key]])
      if (lastPropsRef.current[$key] !== props[$key])
        output.push([`[Updated]`, key, lastPropsRef.current[$key], props[$key]])
    }

    for (const key of Object.keys(lastPropsRef.current)) {
      if (key === 'children') continue
      const $key = key as keyof P
      if (!(key in props)) output.push([`[Removed]`, key, props[$key]])
    }

    if (output.length) {
      console.log(`Updated due to`)
      for (const record of output) {
        console.log(...record.map(r => (typeof r === 'function' ? '[fn]' : r)))
      }
      console.log(`;`)
    }

    lastPropsRef.current = props
  })
}
