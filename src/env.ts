export const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'

type KnownPlatform = 'chrome' | 'firefox'
type Platform = KnownPlatform | Exclude<string, keyof KnownPlatform>

export const PLATFORM: Platform = process.env.PLATFORM || 'unknown'

export const oauth = {
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
  clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
}

export const VERSION = process.env.VERSION
