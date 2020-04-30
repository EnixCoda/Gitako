import { dummyPlatformForTypeSafety } from './dummyPlatformForTypeSafety'
import { Gitee } from './Gitee'
import { GitHub } from './GitHub'

const platforms: {
  [name: string]: Platform
} = {
  GitHub: GitHub,
  Gitee: Gitee,
}

function resolvePlatform() {
  for (const platform of Object.values(platforms)) {
    if (platform.resolveMeta()) return platform
  }
  return dummyPlatformForTypeSafety
}

function getPlatformName() {
  const keys = Object.keys(platforms) as (keyof typeof platforms)[]
  for (const key of keys) {
    if (platform === platforms[key]) return key
  }
}

export const platform = resolvePlatform()
export const platformName = getPlatformName()

export const errors = {
  SERVER_FAULT: 'Server Fault',
  NOT_FOUND: 'Repo Not Found',
  BAD_CREDENTIALS: 'Bad credentials',
  API_RATE_LIMIT: 'API rate limit',
  EMPTY_PROJECT: 'Empty project',
  BLOCKED_PROJECT: 'Blocked project',
  CONNECTION_BLOCKED: 'Connection blocked',
}
