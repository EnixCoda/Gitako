export const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'

export const GITHUB_OAUTH = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
}

export const GITEE_OAUTH = {
  clientId: process.env.GITEE_OAUTH_CLIENT_ID || '',
}

export const VERSION = process.env.VERSION

export const SENTRY = {
  PUBLIC_KEY: process.env.SENTRY_PUBLIC_KEY,
  PROJECT_ID: process.env.SENTRY_PROJECT_ID,
}
