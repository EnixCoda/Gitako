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

async function resolvePlatform(): Promise<Platform> {
  if (isGitHub()) return GitHub
  return dummyPlatformForTypeSafety
}

let p: Platform = dummyPlatformForTypeSafety

export const resolvePlatformP = resolvePlatform()
resolvePlatformP.then(platform => (p = platform))

export const platform: Platform = new Proxy<Platform>(dummyPlatformForTypeSafety, {
  get(target, key: keyof Platform) {
    return p[key]
  },
})

export const errors = {
  SERVER_FAULT: 'Server Fault',
  NOT_FOUND: 'Repo Not Found',
  BAD_CREDENTIALS: 'Bad credentials',
  API_RATE_LIMIT: 'API rate limit',
  EMPTY_PROJECT: 'Empty project',
  BLOCKED_PROJECT: 'Blocked project',
}
