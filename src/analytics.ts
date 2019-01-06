import { version } from '../package.json'
// TODO: set this through ENV or something else
const LOG_ENDPOINT = 'https://enix.one/gitako/log'

export function raiseError(error: Error) {
  return reportError(error)
}

export function withErrorLog(method: Function, args: any[]) {
  return [
    function() {
      try {
        method.apply(this, arguments)
      } catch (error) {
        raiseError(error)
      }
    },
    args,
  ]
}

function encodeParams(params: any) {
  return Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
    .join('&')
}

function reportError(error: Error) {
  return fetch(
    `${LOG_ENDPOINT}?${encodeParams({
      error: (error && error.message) || error,
      path: window.location.href,
      version,
    })}`
  )
}
