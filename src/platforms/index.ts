import { dummyPlatformForTypeSafety } from './dummyPlatformForTypeSafety'
import { GitHub } from './GitHub'

const hosts: Record<'GitHub' | 'GitLab' | 'Gitee', string[]> = {
  GitHub: ['github.com'],
  GitLab: ['gitlab.com'],
  Gitee: ['gitee.com'],
}
function isGitHub() {
  return hosts.GitHub.includes(window.location.host)
}

function resolvePlatform(): Platform {
  if (isGitHub()) return GitHub
  return dummyPlatformForTypeSafety
}

export const platform: Platform = resolvePlatform()

export const errors = {
  SERVER_FAULT: 'Server Fault',
  NOT_FOUND: 'Repo Not Found',
  BAD_CREDENTIALS: 'Bad credentials',
  API_RATE_LIMIT: 'API rate limit',
  EMPTY_PROJECT: 'Empty project',
  BLOCKED_PROJECT: 'Blocked project',
}
