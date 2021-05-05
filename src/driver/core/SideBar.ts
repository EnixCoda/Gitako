import { SideBarStateContextShape } from 'components/SideBarState'
import { ConfigsContextShape } from 'containers/ConfigsContext'
import { GetCreatedMethod, MethodCreator } from 'driver/connect'
import { errors, platformName } from 'platforms'
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

export const handleError: BoundMethodCreator<[Error]> = dispatch => async err => {
  const {
    props: { stateContext },
  } = dispatch.get()
  if (err.message === errors.EMPTY_PROJECT) {
    dispatch.call(setError, 'This project seems to be empty.')
  } else if (err.message === errors.BLOCKED_PROJECT) {
    dispatch.call(setError, 'Access to the project is blocked.')
  } else if (
    err.message === errors.NOT_FOUND ||
    err.message === errors.BAD_CREDENTIALS ||
    err.message === errors.API_RATE_LIMIT
  ) {
    stateContext.onChange('error-due-to-auth')
  } else if (err.message === errors.CONNECTION_BLOCKED) {
    const { props } = dispatch.get()
    if (props.configContext.value.accessToken) {
      dispatch.call(setError, `Cannot connect to ${platformName}.`)
    } else {
      stateContext.onChange('error-due-to-auth')
    }
  } else if (err.message === errors.SERVER_FAULT) {
    dispatch.call(setError, `${platformName} server went down.`)
  } else {
    DOMHelper.markGitakoReadyState(false)
    dispatch.call(setError, 'Some thing went wrong.')
    throw err
  }
}

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
