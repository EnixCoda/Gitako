import primitives from '@primer/primitives'
import { BaseStyles, ThemeProvider } from '@primer/react'
import theme from '@primer/react/lib-esm/theme'
import * as React from 'react'

// Temporary color fix for out-of-date embedded @primer/primitives in @primer/react
// The `*_tritanopia` themes are actually not bundled within @primer/react@35.2.2
// TODO: Upgrade @primer/react to support these themes
const fixedTheme = {
  ...theme,
  colorSchemes: {
    ...theme.colorSchemes,
    light_tritanopia: theme.colorSchemes.light,
    dark_tritanopia: theme.colorSchemes.dark,
  },
}

const validColorSchemes = Object.keys(fixedTheme.colorSchemes) as EnumString<
  keyof typeof primitives['colors']
>[]

const colorModeMap: Record<string, 'night' | 'day'> = {
  dark: 'night',
  light: 'day',
}

const getPreferenceFromDOM = () => {
  // <html lang="en" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark" ...
  // <html lang="en" data-color-mode="light" data-light-theme="light" data-dark-theme="dark" ...
  // <html lang="en" data-color-mode="dark" data-light-theme="light" data-dark-theme="dark" ...
  const { colorMode, lightTheme, darkTheme } = document.documentElement.dataset

  return {
    colorMode: (colorMode && colorModeMap[colorMode]) || 'auto',
    dayScheme: lightTheme && validColorSchemes.includes(lightTheme) ? lightTheme : 'light',
    nightScheme: darkTheme && validColorSchemes.includes(darkTheme) ? darkTheme : 'dark',
  } as const
}

function useThemePreference() {
  const [prefer, setPrefer] = React.useState(getPreferenceFromDOM)
  React.useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setPrefer(getPreferenceFromDOM)
    match.addEventListener('change', update)
    return () => match.removeEventListener('change', update)
  }, [])
  return prefer
}

export function Theme({ children }: React.PropsWithChildren<{}>) {
  const themePreference = useThemePreference()
  return (
    <ThemeProvider {...themePreference} theme={fixedTheme}>
      <BaseStyles>{children}</BaseStyles>
    </ThemeProvider>
  )
}
