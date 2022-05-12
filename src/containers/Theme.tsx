import { ThemeProvider } from '@primer/react'
import * as React from 'react'

const getIsPreferDarkTheme = () => {
  const colorMode = document.documentElement.dataset.colorMode
  return (
    colorMode === 'dark' ||
    (colorMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}
// No need to watch the property as it does not change in repo pages
function usePreferDarkTheme() {
  const [prefer, setPrefer] = React.useState(getIsPreferDarkTheme)
  React.useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setPrefer(match.matches) // `.matches` will update on media change
    match.addEventListener('change', update)
    return () => match.removeEventListener('change', update)
  }, [])
  return prefer
}

export function Theme({ children }: React.PropsWithChildren<{}>) {
  const preferDarkTheme = usePreferDarkTheme()
  return (
    <ThemeProvider colorMode={preferDarkTheme ? 'night' : 'day'} dayScheme="" {...{ children }} />
  )
}
