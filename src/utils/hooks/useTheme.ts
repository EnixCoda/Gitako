import * as React from 'react'
import { Config } from 'utils/configHelper'
import * as DOMHelper from 'utils/DOMHelper'

export function useTheme(theme: Config['theme']) {
  React.useEffect(() => DOMHelper.setTheme(theme), [theme])
}
