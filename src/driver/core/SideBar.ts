import { SideBarStateContextShape } from 'components/SideBarState'
import { ConfigsContextShape } from 'containers/ConfigsContext'
import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import * as DOMHelper from 'utils/DOMHelper'

export type Props = {
  // meta data for the repository
  metaData: MetaData | null
  configContext: ConfigsContextShape
  stateContext: SideBarStateContextShape
}

export type ConnectorState = {
  // error message
  error?: string
  // whether Gitako side bar should be shown
  shouldShow: boolean
} & {
  setShouldShow: GetCreatedMethod<typeof setShouldShow>
  toggleShowSideBar: GetCreatedMethod<typeof toggleShowSideBar>
}

type BoundMethodCreator<Args extends any[] = []> = MethodCreator<Props, ConnectorState, Args>

export const toggleShowSideBar: BoundMethodCreator = dispatch => () => {
  const {
    state: { shouldShow },
    props: { configContext },
  } = dispatch.get()
  dispatch.call(setShouldShow, !shouldShow)

  const {
    value: { intelligentToggle },
  } = configContext
  if (intelligentToggle !== null) {
    configContext.onChange({ intelligentToggle: !shouldShow })
  }
}

export const setShouldShow: BoundMethodCreator<
  [ConnectorState['shouldShow']]
> = dispatch => shouldShow => {
  dispatch.set({ shouldShow }, shouldShow ? DOMHelper.focusFileExplorer : undefined)
  DOMHelper.setBodyIndent(shouldShow)
}

export const setError: BoundMethodCreator<[ConnectorState['error']]> = dispatch => error => {
  dispatch.set({ error })
  dispatch.call(setShouldShow, false)
}
