import { PinIcon, TabIcon } from '@primer/octicons-react'
import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { Footer } from 'components/Footer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { SideBarBodyWrapper } from 'components/SideBarBodyWrapper'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import { detectBrowser, run } from 'utils/general'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useOnPJAXDone, usePJAX } from 'utils/hooks/usePJAX'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarErrorContext } from '../containers/ErrorContext'
import { SideBarStateContext } from '../containers/SideBarState'
import { Theme } from '../containers/Theme'
import { useToggleSideBarWithKeyboard } from '../utils/hooks/useToggleSideBarWithKeyboard'
import { LoadingIndicator } from './LoadingIndicator'
import { RoundIconButton } from './RoundIconButton'
import { SettingsBarContent } from './settings/SettingsBar'

export function SideBar() {
  const state = useLoadedContext(SideBarStateContext).value
  const configContext = useConfigs()

  const { sideBarWidth } = configContext.value
  const [baseSize] = React.useState(() => sideBarWidth)

  const [showSettings, setShowSettings] = React.useState(false)
  const toggleShowSettings = React.useCallback(() => setShowSettings(show => !show), [])

  const $logoContainerElement = useStateIO<HTMLElement | null>(null)

  const hasMetaData = state !== 'disabled' // will be true since retrieving data, cannot use Boolean(metaData)
  React.useEffect(() => {
    if (hasMetaData) {
      DOMHelper.markGitakoReadyState(true)
      setShowSettings(false)
      const mountPointElement = DOMHelper.insertLogoMountPoint()
      if (mountPointElement) $logoContainerElement.onChange(mountPointElement)
    } else {
      DOMHelper.markGitakoReadyState(false)
    }
  }, [hasMetaData]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (detectBrowser() === 'Safari') DOMHelper.markGitakoSafariFlag()
  }, [])

  const { sidebarToggleMode, intelligentToggle } = configContext.value
  const $shouldShow = useStateIO(() =>
    intelligentToggle === null
      ? sidebarToggleMode === 'persistent'
        ? platform.shouldShow()
        : false
      : intelligentToggle,
  )
  const shouldShow = $shouldShow.value
  React.useEffect(() => {
    if (sidebarToggleMode === 'persistent') {
      DOMHelper.setBodyIndent(shouldShow)
    } else {
      DOMHelper.setBodyIndent(false)
    }

    if (shouldShow) {
      DOMHelper.focusFileExplorer() // TODO: verify if it works
    }
  }, [shouldShow, sidebarToggleMode])

  // Save expand state on toggle if auto expand is off
  React.useEffect(() => {
    if (intelligentToggle !== null) {
      configContext.onChange({ intelligentToggle: shouldShow })
    }
  }, [shouldShow, intelligentToggle]) // eslint-disable-line react-hooks/exhaustive-deps

  const error = useLoadedContext(SideBarErrorContext).value
  // Lock shouldShow on error
  React.useEffect(() => {
    if (error && shouldShow) {
      $shouldShow.onChange(false)
    }
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  const setShowSideBar = React.useCallback(
    (show: boolean) => {
      if (!error) $shouldShow.onChange(show)
    },
    [error], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const toggleShowSideBar = React.useCallback(() => {
    if (!error) $shouldShow.onChange(show => !show)
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps
  useToggleSideBarWithKeyboard(state, toggleShowSideBar)

  const updateSideBarVisibility = React.useCallback(() => {
    if (intelligentToggle === null && sidebarToggleMode === 'persistent') {
      setShowSideBar(platform.shouldShow())
    }
  }, [intelligentToggle, sidebarToggleMode, setShowSideBar])

  useOnPJAXDone(updateSideBarVisibility)

  platform.usePlatformHooks?.()

  usePJAX()

  // Hide sidebar when error due to auth but token is set  #128
  const { accessToken } = configContext.value
  const hideSidebarOnInvalidToken: boolean =
    intelligentToggle === null && Boolean(state === 'error-due-to-auth' && accessToken)
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) {
      setShowSideBar(false)
    }
  }, [hideSidebarOnInvalidToken, setShowSideBar])

  return (
    <Theme>
      <div className={'gitako-side-bar'}>
        <Portal into={$logoContainerElement.value}>
          <ToggleShowButton
            error={error}
            className={cx({
              hidden: shouldShow,
            })}
            onHover={sidebarToggleMode === 'float' ? () => setShowSideBar(true) : undefined}
            onClick={toggleShowSideBar}
          />
        </Portal>
        <SideBarBodyWrapper
          className={cx(`toggle-mode-${sidebarToggleMode}`, {
            collapsed: error || !shouldShow,
          })}
          baseSize={baseSize}
          onLeave={sidebarToggleMode === 'float' ? () => setShowSideBar(false) : undefined}
          sizeVariableMountPoint={sidebarToggleMode === 'persistent' ? document.body : undefined}
        >
          <div className={'gitako-side-bar-body'}>
            <div
              className={'gitako-side-bar-content'}
              onClick={showSettings ? toggleShowSettings : undefined}
            >
              <div className={'header'}>
                <div className={'close-side-bar-button-position'}>
                  {sidebarToggleMode === 'persistent' && (
                    <RoundIconButton
                      icon={TabIcon}
                      aria-label={'Collapse sidebar'}
                      sx={{
                        transform: 'rotateY(180deg)',
                      }}
                      onClick={toggleShowSideBar}
                    />
                  )}
                  <RoundIconButton
                    icon={PinIcon}
                    aria-label={'Toggle sidebar dock mode between float and persistent'}
                    iconColor={sidebarToggleMode === 'persistent' ? 'fg.default' : undefined}
                    sx={{
                      transform: 'rotateY(180deg)',
                    }}
                    onClick={() =>
                      configContext.onChange({
                        sidebarToggleMode:
                          sidebarToggleMode === 'persistent' ? 'float' : 'persistent',
                      })
                    }
                  />
                </div>
                <MetaBar />
              </div>
              {run(() => {
                switch (state) {
                  case 'disabled':
                    return null
                  case 'getting-access-token':
                    return <LoadingIndicator text={'Getting access token...'} />
                  case 'after-getting-access-token':
                  case 'meta-loading':
                    return <LoadingIndicator text={'Fetching repo meta...'} />
                  case 'error-due-to-auth':
                    return <AccessDeniedDescription />
                  case 'meta-loaded':
                  case 'tree-loading':
                  case 'tree-rendering':
                  case 'tree-rendered':
                    return <FileExplorer />
                }
              })}
            </div>
            {showSettings && <SettingsBarContent toggleShow={toggleShowSettings} />}
            <Footer toggleShowSettings={toggleShowSettings} />
          </div>
        </SideBarBodyWrapper>
      </div>
    </Theme>
  )
}
