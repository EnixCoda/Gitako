import { Middleware } from 'driver/connect.js'
import { IN_PRODUCTION_MODE } from 'env'
import * as Sentry from '@sentry/browser'
import { version } from '../package.json'

const PUBLIC_KEY = 'd22ec5c9cc874539a51c78388c12e3b0'
const PROJECT_ID = '1406497'

Sentry.init({
  dsn: `https://${PUBLIC_KEY}@sentry.io/${PROJECT_ID}`,
  release: `v${version}`,
  environment: IN_PRODUCTION_MODE ? 'production' : 'development',
})

export function raiseError(error: Error, extra?: any) {
  return reportError(error, extra)
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

function reportError(error: Error, extra?: any) {
  if (!IN_PRODUCTION_MODE) {
    console.error(error)
    console.error('Extra:\n', extra)
    // return
  }

  Sentry.captureException(error)
  if (extra) {
    Sentry.withScope(scope => {
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key])
      })
    })
  }
}
