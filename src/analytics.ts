import { version } from '../package.json'
import { Middleware } from 'driver/connect.js'
import { IN_PRODUCTION_MODE } from 'env'
// TODO: set this through ENV or something else
const LOG_ENDPOINT = 'https://enix.one/gitako/log'

export function raiseError(error: Error) {
  return reportError(error)
}

export const withErrorLog: Middleware = function withErrorLog(method, args) {
  return [
    function() {
      try {
        method.apply(this, arguments)
      } catch (error) {
        raiseError(error)
      }
    } as any, // TOFIX: not sure how to fix this yet
    args,
  ]
}

function encodeParams(params: object) {
  return Object.keys(params)
    .map((key: keyof object) => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
    .join('&')
}

function reportError(error: Error) {
  if (!IN_PRODUCTION_MODE) return
  return fetch(
    `${LOG_ENDPOINT}?${encodeParams({
      error: (error && error.message) || error,
      path: window.location.href,
      version,
    })}`
  )
}
