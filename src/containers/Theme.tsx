import { BaseStyles, ThemeProvider } from '@primer/react'
import theme from '@primer/react/lib-esm/theme'
import * as React from 'react'

const colorModeMap: Record<string, 'night' | 'day'> = {
  dark: 'night',
  light: 'day',
}

const validColorSchemes = Object.keys(theme.colorSchemes) as EnumString<
  | 'light'
  | 'light_high_contrast'
  | 'light_colorblind'
  | 'light_tritanopia'
  | 'dark'
  | 'dark_dimmed'
  | 'dark_high_contrast'
  | 'dark_colorblind'
  | 'dark_tritanopia'
>[]
// The `*_tritanopia` themes are actually not bundled within @primer/react@35.2.2
// TODO: Upgrade @primer/react to support these themes
// BUT: Do not remove the validation, there might be other themes in future

const getPreferenceFromDOM = () => {
  // <html lang="en" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark" ...
  // <html lang="en" data-color-mode="light" data-light-theme="light" data-dark-theme="dark" ...
  // <html lang="en" data-color-mode="dark" data-light-theme="light" data-dark-theme="dark" ...
  const { colorMode, lightTheme, darkTheme } = document.documentElement.dataset

  return {
    colorMode: (colorMode && colorModeMap[colorMode]) || 'auto',
    dayScheme: lightTheme && validColorSchemes.includes(lightTheme) ? lightTheme : undefined,
    nightScheme: darkTheme && validColorSchemes.includes(darkTheme) ? darkTheme : undefined,
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
    <ThemeProvider {...themePreference}>
      <BaseStyles>{children}</BaseStyles>
    </ThemeProvider>
  )
}
