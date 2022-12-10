import { useConfigs } from 'containers/ConfigsContext'
import { errors, platformName } from 'platforms'
import { useCallback } from 'react'
import { assert } from 'utils/assert'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { SideBarErrorContext } from '../../containers/ErrorContext'
import { SideBarStateContext } from '../../containers/SideBarState'

export function useCatchNetworkError() {
  const { accessToken } = useConfigs().value
  const stateContext = useLoadedContext(SideBarStateContext)
  const errorContext = useLoadedContext(SideBarErrorContext)

  return useCallback(
    async function <T>(fn: () => T) {
      try {
        return await fn() // keep the await so that catch block can catch async errors
      } catch (err) {
        assert(err instanceof Error)

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
          errorContext.onChange('Something unexpected happened.')
          throw err
        }
      }
    },
    [accessToken /* , stateContext.value, errorContext.value */], // eslint-disable-line react-hooks/exhaustive-deps
  )
}
