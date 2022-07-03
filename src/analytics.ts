import * as Sentry from '@sentry/browser'
import { IN_PRODUCTION_MODE, VERSION } from 'env'
import { platform } from 'platforms'
import { atomicAsyncFunction, forOf } from 'utils/general'
import { storageHelper, storageKeys } from 'utils/storageHelper'

const PUBLIC_KEY = 'd22ec5c9cc874539a51c78388c12e3b0'
const PROJECT_ID = '1406497'

const MAX_REPORT_COUNT = 10 // prevent error overflow
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

// 1. Only cache errors for current version, so that future errors can still be exposed
//   - Run migration to clean on every update

// 2. Only cache the top 2 levels of stack, e.g.
// ```
// Error: cannot get current branch
//    at Module.getCurrentBranch (chrome-extension://______id______/index.js:1:1)"
// ```
// So that different initial callees would not result in multiple records
const MAX_STACK_LEVEL = 2
const hasTheErrorBeenReported = atomicAsyncFunction(async function hasTheErrorBeenReported(
  error: Error,
) {
  const message = error.stack?.split('\n').slice(0, MAX_STACK_LEVEL).join('\n')
  if (!message) return true // ignore errors that has no stack

  type ErrorCache = string
  const cache: ErrorCache[] =
    ((await storageHelper.get(storageKeys.raiseErrorCache))?.[
      storageKeys.raiseErrorCache
    ] as string[]) || []
  const has = cache.includes(message)

  if (!has) {
    cache.push(message)
    await storageHelper.set({ [storageKeys.raiseErrorCache]: cache })
  }

  return has
})

export async function raiseError(
  error: Error,
  extra?: {
    [key: string]: any
  },
) {
  if (await hasTheErrorBeenReported(error)) return

  if (!IN_PRODUCTION_MODE || platform.isEnterprise()) {
    // ignore errors from enterprise to get less noise on Sentry
    console.error(error)
    console.error('Extra:\n', extra)
    return
  }

  Sentry.withScope(scope => {
    if (typeof extra === 'object' && extra) {
      forOf(extra, (key, value) => scope.setExtra(`${key}`, value))
    }
    Sentry.captureException(error)
  })
}
