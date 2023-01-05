import { useConfigs } from 'containers/ConfigsContext'
import { errors, platform, platformName } from 'platforms'
import { useCallback } from 'react'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { SideBarErrorContext } from '../../containers/ErrorContext'
import { SideBarStateContext } from '../../containers/SideBarState'

export function useHandleNetworkError() {
  const { accessToken } = useConfigs().value
  const changeErrorContext = useLoadedContext(SideBarErrorContext).onChange
  const changeStateContext = useLoadedContext(SideBarStateContext).onChange

  return useCallback(
    function handleNetworkError(err: Error) {
      const message = platform.mapErrorMessage?.(err) || err.message
      if (message === errors.EMPTY_PROJECT) {
        changeErrorContext('This project seems to be empty.')
        return
      }

      if (message === errors.BLOCKED_PROJECT) {
        changeErrorContext('Access to the project is blocked.')
        return
      }

      if (
        message === errors.NOT_FOUND ||
        message === errors.BAD_CREDENTIALS ||
        message === errors.API_RATE_LIMIT
      ) {
        changeStateContext('error-due-to-auth')
        return
      }

      if (message === errors.CONNECTION_BLOCKED) {
        if (accessToken) changeErrorContext(`Cannot connect to ${platformName}.`)
        else changeStateContext('error-due-to-auth')

        return
      }

      if (message === errors.SERVER_FAULT) {
        changeErrorContext(`${platformName} server went down.`)
        return
      }

      changeStateContext('disabled')
      changeErrorContext('Something unexpected happened.')
      throw err
    },
    [accessToken, changeErrorContext, changeStateContext],
  )
}
