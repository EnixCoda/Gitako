import * as Sentry from '@sentry/browser'
import { Middleware } from 'driver/connect.js'
import { IN_PRODUCTION_MODE, VERSION } from 'env'
import { platform } from 'platforms'

const PUBLIC_KEY = 'd22ec5c9cc874539a51c78388c12e3b0'
const PROJECT_ID = '1406497'

const MAX_REPORT_COUNT = 10 // protect for error leaking
let countReportedError = 0

const errorSet = new Set<string>([
  'inThisSearch is null', // weird bug in Firefox
  'The quota has been exceeded.', // caused by other addons in Firefox
  'NetworkError when attempting to fetch resource.', // network fail in Firefox
  'Failed to fetch', // network fail in Chrome
])

const disabledIntegrations: string[] = [
  'TryCatch',
  'Breadcrumbs',
  'GlobalHandlers',
  'CaptureConsole',
]
const sentryOptions: Sentry.BrowserOptions = {
  dsn: `https://${PUBLIC_KEY}@sentry.io/${PROJECT_ID}`,
  release: VERSION,
  environment: IN_PRODUCTION_MODE ? 'production' : 'development',
  // Not safe to activate all integrations in non-Chrome environments where Gitako may not run in top context
  // https://docs.sentry.io/platforms/javascript/#sdk-integrations
  defaultIntegrations: IN_PRODUCTION_MODE ? undefined : false,
  integrations: integrations =>
    integrations.filter(({ name }) => !disabledIntegrations.includes(name)),
  beforeSend(event) {
    const message = event.exception?.values?.[0].value || event.message
    if (message) {
      if (errorSet.has(message)) return null
      errorSet.add(message) // prevent reporting duplicated error
    }
    if (countReportedError < MAX_REPORT_COUNT) {
      ++countReportedError
      return event
    }
    return null
  },
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.category === 'ui.click') {
      const ariaLabel = hint?.event?.target?.ariaLabel
      if (ariaLabel) {
        breadcrumb.message = ariaLabel
      }
    }
    return breadcrumb
  },
  autoSessionTracking: false, // this avoids the request when calling `init`
}
Sentry.init(sentryOptions)

export const withErrorLog: Middleware = function withErrorLog(method, args) {
  return [
    async function () {
      try {
        await method.apply(null, arguments as any)
      } catch (error) {
        raiseError(error)
      }
    } as any, // TO FIX: not sure how to fix this yet
    args,
  ]
}

export function raiseError(
  error: Error,
  extra?: {
    [key: string]: any
  },
) {
  if (!IN_PRODUCTION_MODE || platform.isEnterprise()) {
    // ignore errors from enterprise to get less noise on Sentry
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
