import { Middleware } from 'driver/connect.js'
import { IN_PRODUCTION_MODE } from 'env'
import { version } from '../package.json'
// TODO: set this through ENV or something else
const LOG_ENDPOINT = 'https://enix.one/gitako/log'

export function raiseError(error: Error) {
  return reportError(error)
}

export const withErrorLog: Middleware = function withErrorLog(method, args) {
  return [
    async function(...args: any[]) {
      try {
        await method.apply(null, args)
      } catch (error) {
        raiseError(error)
      }
    } as any, // TO FIX: not sure how to fix this yet
    args,
  ]
}

function encodeParams<
  T extends {
    [key: string]: any
  }
>(params: T) {
  return Object.keys(params)
    .map((key: keyof T) => `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`)
    .join('&')
}

function reportError(error: Error) {
  if (!IN_PRODUCTION_MODE) return
  return fetch(
    `${LOG_ENDPOINT}?${encodeParams({
      error: (error && error.message) || error,
      path: window.location.href,
      version,
    })}`,
  )
}
