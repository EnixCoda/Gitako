import { useConfigs } from 'containers/ConfigsContext'
import { errors, platformName } from 'platforms'
import { useCallback } from 'react'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { SideBarErrorContext } from '../../components/ErrorContext'
import { SideBarStateContext } from '../../components/SideBarState'

export function useCatchNetworkError() {
  const { accessToken } = useConfigs().value
  const stateContext = useLoadedContext(SideBarStateContext)
  const errorContext = useLoadedContext(SideBarErrorContext)

  return useCallback(
    async function <T>(fn: () => T) {
      try {
        return await fn() // keep the await so that catch block can catch async errors
      } catch (err) {
        if (err.message === errors.EMPTY_PROJECT) {
          errorContext.onChange('This project seems to be empty.')
        } else if (err.message === errors.BLOCKED_PROJECT) {
          errorContext.onChange('Access to the project is blocked.')
        } else if (
          err.message === errors.NOT_FOUND ||
          err.message === errors.BAD_CREDENTIALS ||
          err.message === errors.API_RATE_LIMIT
        ) {
          stateContext.onChange('error-due-to-auth')
        } else if (err.message === errors.CONNECTION_BLOCKED) {
          if (accessToken) {
            errorContext.onChange(`Cannot connect to ${platformName}.`)
          } else {
            stateContext.onChange('error-due-to-auth')
          }
        } else if (err.message === errors.SERVER_FAULT) {
          errorContext.onChange(`${platformName} server went down.`)
        } else {
          stateContext.onChange('disabled')
          errorContext.onChange('Some thing went wrong.')
          throw err
        }
      }
    },
    [accessToken /* , stateContext.value, errorContext.value */],
  )
}
