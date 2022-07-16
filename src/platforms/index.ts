import { forOf } from 'utils/general'
import { dummyPlatformForTypeSafety } from './dummyPlatformForTypeSafety'
import { Gitea } from './Gitea'
import { Gitee } from './Gitee'
import { GitHub } from './GitHub'

const platforms = {
  GitHub,
  Gitee,
  Gitea,
}

function resolvePlatform() {
  return (
    forOf(platforms, (platformName, platform) => {
      const { shouldActivate = () => !!platform.resolvePartialMetaData() } = platform
      if (shouldActivate()) return platform
    }) || dummyPlatformForTypeSafety
  )
}

function getPlatformName() {
  return forOf(platforms, (name, $platform) => {
    if (platform === $platform) return name
  })
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
