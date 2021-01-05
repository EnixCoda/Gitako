export const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'

export const GITHUB_OAUTH = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
}

export const GITEE_OAUTH = {
  clientId: process.env.GITEE_OAUTH_CLIENT_ID || '',
}

export const GITEA_OAUTH = {
  clientId: process.env.GITEA_OAUTH_CLIENT_ID || '',
}

export const VERSION = process.env.VERSION
