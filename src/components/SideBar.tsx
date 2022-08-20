import { PinIcon, TabIcon } from '@primer/octicons-react'
import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { Footer } from 'components/Footer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import * as React from 'react'
import { IIFC } from 'react-iifc'
import { useWindowSize } from 'react-use'
import { Config } from 'utils/config/helper'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import * as features from 'utils/features'
import { detectBrowser } from 'utils/general'
import { useConditionalHook } from 'utils/hooks/useConditionalHook'
import { useAfterRedirect, usePJAXAPI } from 'utils/hooks/useFastRedirect'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { ResizeState } from 'utils/hooks/useResizeHandler'
import * as keyHelper from 'utils/keyHelper'
import { SideBarErrorContext } from '../containers/ErrorContext'
import { SideBarStateContext } from '../containers/SideBarState'
import { Theme } from '../containers/Theme'
import { LoadingIndicator } from './LoadingIndicator'
import { RoundIconButton } from './RoundIconButton'
import { SettingsBarContent } from './settings/SettingsBar'
import { SideBarResizeHandler } from './SideBarResizeHandler'

export function SideBar() {
  usePJAXAPI()
  platform.usePlatformHooks?.()
  useMarkGitakoReadyState()

  const error = useLoadedContext(SideBarErrorContext).value

  const [shouldExpand, setShouldExpand, toggleShowSideBar] = useShouldExpand()

  const configContext = useConfigs()

  const blockLeaveRef = React.useRef(false)
  const { sidebarToggleMode } = configContext.value
  const onResizeStateChange = React.useCallback((state: ResizeState) => {
    blockLeaveRef.current = state === 'resizing'
  }, [])

  const heightForSafari = useConditionalHook(
    () => detectBrowser() === 'Safari',
    () => useWindowSize().height, // eslint-disable-line react-hooks/rules-of-hooks
  )

  return (
    <Theme>
      <IIFC>
        {() => {
          const logoContainerElement = useLogoContainerElement()
          return (
            <Portal into={logoContainerElement}>
              <ToggleShowButton
                error={error}
                className={cx({
                  hidden: shouldExpand,
                })}
                onHover={sidebarToggleMode === 'float' ? () => setShouldExpand(true) : undefined}
                onClick={toggleShowSideBar}
              />
            </Portal>
          )
        }}
      </IIFC>
      <div className={'gitako-side-bar'}>
        <div
          className={cx('gitako-side-bar-body-wrapper', `toggle-mode-${sidebarToggleMode}`, {
            collapsed: error || !shouldExpand,
          })}
          style={{ height: heightForSafari }}
          onMouseLeave={() => {
            if (blockLeaveRef.current) return
            if (sidebarToggleMode === 'float') setShouldExpand(false)
          }}
        >
          <div className={'gitako-side-bar-body'}>
            <div className={'gitako-side-bar-content'}>
              <div className={'header'}>
                <div className={'side-bar-position-controls'}>
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
              <IIFC>
                {() => {
                  switch (useLoadedContext(SideBarStateContext).value) {
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
                }}
              </IIFC>
            </div>
            <IIFC>
              {() => {
                const [showSettings, setShowSettings] = React.useState(false)
                const toggleShowSettings = React.useCallback(
                  () => setShowSettings(show => !show),
                  [],
                )

                return (
                  <>
                    {showSettings && <SettingsBarContent toggleShow={toggleShowSettings} />}
                    <Footer toggleShowSettings={toggleShowSettings} />
                  </>
                )
              }}
            </IIFC>
          </div>
          {features.resize && <SideBarResizeHandler onResizeStateChange={onResizeStateChange} />}
        </div>
      </div>
    </Theme>
  )
}

function useMarkGitakoReadyState() {
  React.useEffect(() => {
    DOMHelper.markGitakoReadyState(true)
    return () => DOMHelper.markGitakoReadyState(false)
  }, [])
}

function useLogoContainerElement() {
  const [logoContainerElement, setLogoContainerElement] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    setLogoContainerElement(DOMHelper.insertLogoMountPoint())
  }, [])
  return logoContainerElement
}

function useUpdateBodyIndentOnStateUpdate(shouldExpand: boolean) {
  const { sidebarToggleMode } = useConfigs().value
  React.useEffect(() => {
    if (sidebarToggleMode === 'persistent' && shouldExpand) {
      DOMHelper.setBodyIndent(true)
      return () => DOMHelper.setBodyIndent(false)
    }
  }, [sidebarToggleMode, shouldExpand])
}

const getDerivedExpansion = ({
  intelligentToggle,
  sidebarToggleMode,
}: Pick<Config, 'intelligentToggle' | 'sidebarToggleMode'>) =>
  sidebarToggleMode === 'persistent'
    ? intelligentToggle === null // auto-expand checked
      ? platform.shouldExpandSideBar()
      : intelligentToggle // read saved expand state
    : false // do not expand in float mode

function useGetDerivedExpansion() {
  const { intelligentToggle, sidebarToggleMode } = useConfigs().value
  return React.useCallback(
    () => getDerivedExpansion({ intelligentToggle, sidebarToggleMode }),
    [intelligentToggle, sidebarToggleMode],
  )
}

function useUpdateBodyIndentAfterRedirect(update: (shouldExpand: boolean) => void) {
  const { intelligentToggle, sidebarToggleMode } = useConfigs().value
  useAfterRedirect(
    React.useCallback(() => {
      // check and update expand state if pinned and auto-expand checked
      if (sidebarToggleMode === 'persistent') {
        const shouldExpand = getDerivedExpansion({ intelligentToggle, sidebarToggleMode })
        update(shouldExpand)
        // Below DOM mutation cannot be omitted, if do, body indent may get lost when shouldExpand is true for both before & after redirecting
        DOMHelper.setBodyIndent(shouldExpand)
      }
    }, [update, sidebarToggleMode, intelligentToggle]),
  )
}

// Save expand state on toggle if auto expand is off
function useSaveExpandStateOnToggle(shouldExpand: boolean) {
  const configContext = useConfigs()
  const { intelligentToggle } = configContext.value
  React.useEffect(() => {
    if (intelligentToggle !== null) configContext.onChange({ intelligentToggle: shouldExpand })
  }, [shouldExpand, intelligentToggle]) // eslint-disable-line react-hooks/exhaustive-deps
}

function useToggleSideBarWithKeyboard(toggleShowSideBar: () => void) {
  const { shortcut } = useConfigs().value
  const state = useLoadedContext(SideBarStateContext).value
  const isDisabled = state === 'disabled' || !shortcut
  React.useEffect(
    function attachKeyDown() {
      if (isDisabled) return

      function onKeyDown(e: KeyboardEvent) {
        const keys = keyHelper.parseEvent(e)
        if (keys === shortcut) toggleShowSideBar()
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    },
    [toggleShowSideBar, isDisabled, shortcut],
  )
}

function useCollapseOnNoPermissionWhenTokenHasBeenSet(
  setShowSideBar: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const { accessToken, intelligentToggle, sidebarToggleMode } = useConfigs().value
  const state = useLoadedContext(SideBarStateContext).value
  const hideSidebarOnInvalidToken =
    sidebarToggleMode === 'persistent' &&
    intelligentToggle === null &&
    !!accessToken &&
    state === 'error-due-to-auth'
  React.useEffect(() => {
    if (hideSidebarOnInvalidToken) setShowSideBar(false)
  }, [hideSidebarOnInvalidToken, setShowSideBar])
}

function useShouldExpand() {
  const getDerivedExpansion = useGetDerivedExpansion()
  const [shouldExpand, setShouldExpand] = React.useState(getDerivedExpansion)
  const toggleShowSideBar = React.useCallback(
    () => setShouldExpand(show => !show),
    [setShouldExpand],
  )

  useSaveExpandStateOnToggle(shouldExpand)
  useUpdateBodyIndentOnStateUpdate(shouldExpand)
  useUpdateBodyIndentAfterRedirect(setShouldExpand)
  useToggleSideBarWithKeyboard(toggleShowSideBar)
  useCollapseOnNoPermissionWhenTokenHasBeenSet(setShouldExpand)

  React.useEffect(() => {
    if (shouldExpand) DOMHelper.focusFileExplorer() // TODO: verify if it works
  }, [shouldExpand])

  return [shouldExpand, setShouldExpand, toggleShowSideBar] as const
}
