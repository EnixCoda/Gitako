import { usePlatform } from 'containers/PlatformContext'
import { GITHUB_OAUTH } from 'env'
import { GitHub } from 'platforms/GitHub'
import * as React from 'react'

export function AccessDeniedDescription({ hasToken }: { hasToken: boolean }) {
  const platform = usePlatform()
  return (
    <div className={'description'}>
      <h5>Access Denied</h5>
      {hasToken ? (
        <>
          <p>
            Current access token is either invalid or not granted with permissions to access this
            project.
          </p>
          {platform === GitHub && (
            <p>
              You can grant or request access{' '}
              <a
                href={`https://github.com/settings/connections/applications/${GITHUB_OAUTH.clientId}`}
              >
                here
              </a>{' '}
              if you setup Gitako with OAuth.
            </p>
          )}
        </>
      ) : (
        <p>
          Gitako needs access token to read this project. Please setup access token in the settings
          panel below.
        </p>
      )}
    </div>
  )
}
