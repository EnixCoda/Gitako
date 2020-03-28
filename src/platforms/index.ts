import * as storageHelper from 'utils/storageHelper'
import { dummyPlatformForTypeSafety } from './dummyPlatformForTypeSafety'
import { GitHub } from './GitHub'

const platformsMap: Record<
  'GitHub' | 'GitLab' | 'Gitee',
  { platform: Platform; hosts: string[] }
> = {
  GitHub: { platform: GitHub, hosts: ['github.com'] },
  GitLab: { platform: GitHub, hosts: ['gitlab.com'] },
  Gitee: { platform: GitHub, hosts: ['gitee.com'] },
}

const CustomDomainsStorageKey = 'CUSTOM_DOMAINS'
async function loadCustomDomains() {
  const c = await storageHelper.get([CustomDomainsStorageKey])
  if (c) {
    const { [CustomDomainsStorageKey]: customDomains } = c
    if (customDomains) {
      Object.keys(customDomains).forEach(domain => {
        if (domain in platformsMap) {
          platformsMap[domain as keyof typeof platformsMap].hosts.push(...customDomains[domain])
        }
      })
    }
  }
}
loadCustomDomains()

async function resolvePlatform(): Promise<Platform> {
  for (const { hosts, platform } of Object.values(platformsMap)) {
    if (hosts.some(host => host === window.location.host)) {
      return platform
    }
  }
  return dummyPlatformForTypeSafety
}

let $platform: Platform = dummyPlatformForTypeSafety

export const resolvePlatformP = resolvePlatform()
resolvePlatformP.then(platform => ($platform = platform))

export const platform: Platform = new Proxy<Platform>(dummyPlatformForTypeSafety, {
  get(target, key: keyof Platform) {
    return $platform[key]
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
