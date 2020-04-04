import { dummyPlatformForTypeSafety } from './dummyPlatformForTypeSafety'
import { Gitee } from './Gitee'
import { GitHub } from './GitHub'

const platformsMap: Record<'GitHub' | 'Gitee', { platform: Platform; hosts: string[] }> = {
  GitHub: { platform: GitHub, hosts: ['github.com'] },
  Gitee: { platform: Gitee, hosts: ['gitee.com'] },
}

function resolvePlatform() {
  for (const { hosts, platform } of Object.values(platformsMap)) {
    if (hosts.some(host => host === window.location.host || platform.resolveMeta())) {
      return platform
    }
  }
  return dummyPlatformForTypeSafety
}

export function getPlatformName() {
  const keys = Object.keys(platformsMap) as (keyof typeof platformsMap)[]
  for (const key of keys) {
    if (platform === platformsMap[key].platform) return key
  }
}

export const platform = resolvePlatform()

export const errors = {
  SERVER_FAULT: 'Server Fault',
  NOT_FOUND: 'Repo Not Found',
  BAD_CREDENTIALS: 'Bad credentials',
  API_RATE_LIMIT: 'API rate limit',
  EMPTY_PROJECT: 'Empty project',
  BLOCKED_PROJECT: 'Blocked project',
}
