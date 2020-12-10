import { theme } from '@primer/components'
import * as React from 'react'
import { ThemeProvider } from 'styled-components'
const { lighten, rgba, desaturate } = require('polished')

// Refactored from https://github.com/primer/components/blob/main/src/theme-preval.js
export function generateDarkTheme() {
  const primitives = {
    black: '#f0f6fc',
    white: '#010409',
    gray: [
      '#0d1117',
      '#161b22',
      '#21262d',
      '#30363d',
      '#484f58',
      '#6e7681',
      '#8b949e',
      '#b1bac4',
      '#c9d1d9',
      '#f0f6fc',
    ],
    blue: [
      '#051d4d',
      '#0c2d6b',
      '#0d419d',
      '#1158c7',
      '#1f6feb',
      '#388bfd',
      '#58a6ff',
      '#79c0ff',
      '#a5d6ff',
      '#cae8ff',
    ],
    green: [
      '#04260f',
      '#033a16',
      '#0f5323',
      '#196c2e',
      '#238636',
      '#2ea043',
      '#3fb950',
      '#56d364',
      '#7ee787',
      '#aff5b4',
    ],
    yellow: [
      '#341a00',
      '#4b2900',
      '#693e00',
      '#845306',
      '#9e6a03',
      '#bb8009',
      '#d29922',
      '#e3b341',
      '#f2cc60',
      '#f8e3a1',
    ],
    orange: [
      '#3d1300',
      '#5a1e02',
      '#762d0a',
      '#9b4215',
      '#bd561d',
      '#db6d28',
      '#f0883e',
      '#ffa657',
      '#ffc680',
      '#ffdfb6',
    ],
    red: [
      '#490202',
      '#67060c',
      '#8e1519',
      '#b62324',
      '#da3633',
      '#f85149',
      '#ff7b72',
      '#ffa198',
      '#ffc1ba',
      '#ffdcd7',
    ],
    purple: [
      '#271052',
      '#3c1e70',
      '#553098',
      '#6e40c9',
      '#8957e5',
      '#a371f7',
      '#bc8cff',
      '#d2a8ff',
      '#e2c5ff',
      '#eddeff',
    ],
    pink: [
      '#42062a',
      '#5e103e',
      '#7d2457',
      '#9e3670',
      '#bf4b8a',
      '#db61a2',
      '#f778ba',
      '#ff9bce',
      '#ffbedd',
      '#ffdaec',
    ],
  }

  const { black, white, pink, gray, blue, green, orange, purple, red, yellow } = primitives

  // General
  // any :(
  const colors: any = {
    black,
    white,
    gray,
    blue,
    green,
    orange,
    purple,
    red,
    yellow,
    pink,
  }

  colors.bodytext = gray[9]

  colors.blackfade15 = rgba(black, 0.15)
  colors.blackfade30 = rgba(black, 0.3)
  colors.blackfade50 = rgba(black, 0.5)
  colors.blackfade70 = rgba(black, 0.7)
  colors.blackfade85 = rgba(black, 0.85)
  colors.whitefade15 = rgba(white, 0.15)
  colors.whitefade30 = rgba(white, 0.3)
  colors.whitefade50 = rgba(white, 0.5)
  colors.whitefade70 = rgba(white, 0.7)
  colors.whitefade85 = rgba(white, 0.85)

  colors.state = {
    error: red[5],
    failure: red[5],
    pending: yellow[7],
    queued: yellow[7],
    success: green[5],
    unknown: gray[4],
  }

  colors.border = {
    blackFade: colors.blackfade15,
    blue: blue[5],
    blueLight: blue[2],
    grayLight: lighten(0.03, gray[2]),
    gray: gray[2],
    grayDark: gray[3],
    grayDarker: gray[7],
    green: green[4],
    greenLight: desaturate(0.4, green[3]),
    purple: purple[5],
    red: red[5],
    redLight: desaturate(0.6, red[3]),
    white,
    whiteFade: colors.whitefade15,
    yellow: desaturate(0.6, yellow[3]),
  }

  colors.text = {
    white,
    gray: gray[6],
    grayLight: gray[5],
    grayDark: gray[8],
    red: red[6],
  }
  colors.bg = {
    gray: gray[1],
    grayLight: gray[3],
    grayDark: gray[9],
    disabled: gray[2],
  }
  colors.accent = orange[5]
  colors.labels = {
    gray: gray[2],
    grayText: gray[9],
    grayDark: gray[5],
    grayDarkText: gray[9],
    blue: blue[5],
    blueText: blue[5],
    orange: orange[5],
    orangeText: orange[6],
    green: green[5],
    greenText: green[6],
    red: red[6],
    redText: red[6],
    yellow: yellow[6],
    yellowText: yellow[9],
    pink: pink[4],
    pinkText: pink[6],
    purple: purple[4],
  }

  // Components

  const buttons = {
    default: {
      color: {
        default: colors.text.grayDark,
        disabled: gray[4],
      },
      border: {
        default: rgba(black, 0.12),
        active: colors.border.grayDark,
        disabled: colors.border.grayLight,
      },
      bg: {
        default: colors.bg.grayLight,
        hover: colors.gray[3],
        active: colors.bg.gray,
        disabled: colors.bg.grayLight,
      },
      shadow: {
        default: `0 0 transparent, 0 0 transparent`,
        hover: `0 0 transparent, 0 0 transparent`,
        active: `0 0 transparent 0 0 transparent`,
        focus: `0 0 transparent 0 0 transparent`,
      },
    },
  }

  const theme = {
    colors,
    buttons,
  }

  return theme
}

// No need to watch the property as it does not change in repo pages
function useDocumentTheme() {
  const [theme] = React.useState(() => document.documentElement.dataset.colorMode)
  return theme
}

function useWrappedTheme() {
  const docTheme = useDocumentTheme()
  const [wrapped] = React.useState(() => {
    return docTheme === 'dark' ? generateDarkTheme() : theme
  })
  return wrapped
}

export function Theme({ children }: React.PropsWithChildren<{}>) {
  const theme = useWrappedTheme()
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
