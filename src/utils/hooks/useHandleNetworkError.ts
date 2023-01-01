import { useConfigs } from 'containers/ConfigsContext'
import { errors, platformName } from 'platforms'
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
      if (err.message === errors.EMPTY_PROJECT) {
        changeErrorContext('This project seems to be empty.')
        return
      }

      if (err.message === errors.BLOCKED_PROJECT) {
        changeErrorContext('Access to the project is blocked.')
        return
      }

      if (
        err.message === errors.NOT_FOUND ||
        err.message === errors.BAD_CREDENTIALS ||
        err.message === errors.API_RATE_LIMIT
      ) {
        changeStateContext('error-due-to-auth')
        return
      }

      if (err.message === errors.CONNECTION_BLOCKED) {
        if (accessToken) changeErrorContext(`Cannot connect to ${platformName}.`)
        else changeStateContext('error-due-to-auth')

        return
      }

      if (err.message === errors.SERVER_FAULT) {
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
