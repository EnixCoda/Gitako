export const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'

export const GITHUB_OAUTH = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
}

export const GITEE_OAUTH = {
  clientId: process.env.GITEE_OAUTH_CLIENT_ID || '',
  clientSecret: process.env.GITEE_OAUTH_CLIENT_SECRET || '',
}

export const VERSION = process.env.VERSION
