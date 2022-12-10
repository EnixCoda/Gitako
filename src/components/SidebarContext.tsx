import React from 'react'
import { noop } from 'utils/general'
import { FocusTarget } from './FocusTarget'

// Use this to pass state across components under Sidebar
export const SidebarContext = React.createContext<{
  pendingFocusTarget: IO<FocusTarget>
}>({
  pendingFocusTarget: { onChange: noop, value: null },
})
