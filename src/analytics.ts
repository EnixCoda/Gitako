import * as Sentry from '@sentry/browser'
import { Middleware } from 'driver/connect.js'
import { IN_PRODUCTION_MODE, VERSION } from 'env'

const PUBLIC_KEY = 'd22ec5c9cc874539a51c78388c12e3b0'
const PROJECT_ID = '1406497'

const sentryOptions: Sentry.BrowserOptions = {
  dsn: `https://${PUBLIC_KEY}@sentry.io/${PROJECT_ID}`,
  release: VERSION,
  environment: IN_PRODUCTION_MODE ? 'production' : 'development',
  // Not safe to activate all integrations in non-Chrome environments where Gitako may not run in top context
  // https://docs.sentry.io/platforms/javascript/#sdk-integrations
  integrations: ints => ints.filter(({ name }) => name !== 'TryCatch'),
}
Sentry.init(sentryOptions)

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

function reportError(
  error: Error,
  extra?: {
    [key: string]: any
  },
) {
  if (!IN_PRODUCTION_MODE) {
    console.error(error)
    console.error('Extra:\n', extra)
    return
  }

  Sentry.withScope(scope => {
    if (extra) {
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key])
      })
    }
    Sentry.captureException(error)
  })
}
