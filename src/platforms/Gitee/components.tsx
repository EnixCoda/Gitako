import { GITEE_OAUTH } from 'env'
import * as React from 'react'

export function GiteeAccessDeniedError({ hasToken }: { hasToken: boolean }) {
  return (
    <div className={'description'}>
      <h5>Access Denied</h5>
      {hasToken ? (
        <>
          <p>
            Current access token is either invalid or not granted with permissions to access this
            project.
          </p>
          <p>
            You can grant or request access{' '}
            <a
              href={`https://github.com/settings/connections/applications/${GITEE_OAUTH.clientId}`}
            >
              here
            </a>{' '}
            if you setup Gitako with OAuth.
          </p>
        </>
      ) : (
        <p>
          Gitako needs access token to read this project due to{' '}
          <a
            href="https://developer.github.com/v3/#rate-limiting"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub rate limiting
          </a>{' '}
          and{' '}
          <a
            href="https://developer.github.com/v3/#authentication"
            target="_blank"
            rel="noopener noreferrer"
          >
            auth needs
          </a>
          . Please setup access token in the settings panel below.
        </p>
      )}
    </div>
  )
}
