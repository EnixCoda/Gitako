import * as React from 'react'

// I tried to install `react-iifc` but that causes TS build errors for unknown reason
// So here the duplicated code is

export function IIFC({ children }: { children(): React.ReactNode }) {
  return <>{children()}</>
}
