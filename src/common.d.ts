// Similar to `global.d.ts` but with import/export
import { Dispatch, SetStateAction } from 'react'

type ReactIO<T> = {
  value: T
  onChange: Dispatch<SetStateAction<T>>
}

type PropsWithChildren = React.PropsWithChildren<Record<string, unknown>>
