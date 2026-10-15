import { PinIcon, TabIcon } from '@primer/octicons-react'
import { Box, Button, Checkbox, Popover, Text } from '@primer/react'
import { AccessDeniedDescription } from 'components/AccessDeniedDescription'
import { FileExplorer } from 'components/FileExplorer'
import { Footer } from 'components/Footer'
import { MetaBar } from 'components/MetaBar'
import { Portal } from 'components/Portal'
import { ToggleShowButton } from 'components/ToggleShowButton'
import { useConfigs } from 'containers/ConfigsContext'
import { platform, platformName } from 'platforms'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IIFC } from 'react-iifc'
import { useWindowSize } from 'react-use'
import { Config } from 'utils/config/helper'
import { cx } from 'utils/cx'
import * as DOMHelper from 'utils/DOMHelper'
import * as features from 'utils/features'
import { detectBrowser, formatWithShortcut } from 'utils/general'
import { useConditionalHook } from 'utils/hooks/useConditionalHook'
import { useAfterRedirect, usePJAXAPI } from 'utils/hooks/useFastRedirect'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { ResizeState } from 'utils/hooks/useResizeHandler'
import { useStateIO } from 'utils/hooks/useStateIO'
import { SideBarErrorContext } from '../containers/ErrorContext'
import { SideBarStateContext } from '../containers/SideBarState'
import { Theme } from '../containers/Theme'
import { useOnShortcutPressed } from '../utils/hooks/useOnShortcutPressed'
import { FocusTarget } from './FocusTarget'
import { LoadingIndicator } from './LoadingIndicator'
import { RoundIconButton } from './RoundIconButton'
import { SettingsBarContent } from './settings/SettingsBar'
import { keyboardNavRef, SidebarContext } from './SidebarContext'
import { SideBarResizeHandler } from './SideBarResizeHandler'

export function SideBar() {
  usePJAXAPI()
  platform.usePlatformHooks?.()
  useMarkGitakoGlobalAttributes()

  const error = useLoadedContext(SideBarErrorContext).value

  const [showCollapseHint, setShowCollapseHint] = useState(false)
  const onAutoCollapseByNativeTree = useCallback(() => setShowCollapseHint(true), [])
  // If a keyboard-driven navigation is what (re)mounted us — see keyboardNavRef
  // — the rebuilt tree should immediately reclaim focus, so seed the pending
  // target instead of starting null and losing focus to the body.
  const pendingFocusTarget = useStateIO<FocusTarget>(keyboardNavRef.current ? 'files' : null)
  // keyboardNavRef is a module-level singleton (see SidebarContext) so it
  // survives the SideBar remount that a cross-context navigation triggers.
  // Clear it as soon as the user touches the mouse, so mouse-driven file opens
  // auto-collapse as before. Also clear it on a keydown OUTSIDE the sidebar:
  // that means the user's keyboard attention left the tree (e.g. activating a
  // host-page link or hotkey), so the next navigation is no longer tree-driven
  // and auto-collapse must apply again — without this, one keyboard file-open
  // would suppress auto-collapse indefinitely for keyboard-only users.
  // Keydowns inside the sidebar (arrowing, search) keep the session alive.
  useEffect(() => {
    const clear = () => (keyboardNavRef.current = false)
    const clearOnOutsideKeydown = (event: KeyboardEvent) => {
      const { target } = event
      if (target instanceof Element && target.closest('.gitako-side-bar')) return
      clear()
    }
    document.addEventListener('mousedown', clear, true)
    document.addEventListener('keydown', clearOnOutsideKeydown, true)
    return () => {
      document.removeEventListener('mousedown', clear, true)
      document.removeEventListener('keydown', clearOnOutsideKeydown, true)
    }
  }, [])
  const [shouldExpand, setShouldExpand, toggleShowSideBar] = useShouldExpand(
    onAutoCollapseByNativeTree,
    keyboardNavRef,
    pendingFocusTarget.onChange,
  )
  // The hint only makes sense while the bar is collapsed; drop it on expand.
  useEffect(() => {
    if (shouldExpand) setShowCollapseHint(false)
  }, [shouldExpand])
  useFocusSidebarOnExpand(shouldExpand)
  useShowSidebarKeyboard(
    shouldExpand,
    setShouldExpand,
    toggleShowSideBar,
    pendingFocusTarget.onChange,
  )

  const configContext = useConfigs()

  const blockLeaveRef = useRef(false)
  const { sidebarToggleMode, shortcut, focusSearchInputShortcut } = configContext.value
  const onResizeStateChange = useCallback((state: ResizeState) => {
    blockLeaveRef.current = state === 'resizing'
  }, [])

  const heightForSafari = useConditionalHook(
    () => detectBrowser() === 'Safari',
    () => useWindowSize().height,
  )

  const sidebarContextValue = useMemo(
    () => ({ pendingFocusTarget, keyboardNavRef }),
    [pendingFocusTarget],
  )

  const placement = configContext.value.sidebarPlacement

  return (
    <Theme>
      <ToggleShowButtonWrapper
        shouldExpand={shouldExpand}
        setShouldExpand={setShouldExpand}
        toggleShowSideBar={toggleShowSideBar}
        showCollapseHint={showCollapseHint}
        dismissCollapseHint={() => setShowCollapseHint(false)}
      />
      <SidebarContext.Provider value={sidebarContextValue}>
        <div className={'gitako-side-bar'}>
          <div
            className={cx(
              'gitako-side-bar-body-wrapper',
              `toggle-mode-${sidebarToggleMode}`,
              `placement-${placement}`,
              {
                collapsed: error || !shouldExpand,
              },
            )}
            style={{ height: heightForSafari }}
            onMouseLeave={() => {
              if (blockLeaveRef.current) return
              if (sidebarToggleMode === 'float') setShouldExpand(false)
            }}
          >
            {features.resize && placement === 'right' && (
              <SideBarResizeHandler onResizeStateChange={onResizeStateChange} />
            )}
            <div className={'gitako-side-bar-body'}>
              <div className={'gitako-side-bar-content'}>
                <div className={'header'}>
                  <div className={'side-bar-position-controls'}>
                    {sidebarToggleMode === 'persistent' && (
                      <RoundIconButton
                        icon={TabIcon}
                        aria-label={formatWithShortcut('Collapse sidebar', shortcut)}
                        sx={{
                          transform: 'rotateY(180deg)',
                        }}
                        onClick={toggleShowSideBar}
                      />
                    )}
                    {platformName !== 'Gitee' && (
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
                    )}
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
                  const [showSettings, setShowSettings] = useState(false)
                  const toggleShowSettings = useCallback(() => setShowSettings(show => !show), [])

                  useOnShortcutPressed(
                    focusSearchInputShortcut,
                    useCallback(() => setShowSettings(false), []),
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
            {features.resize && placement === 'left' && (
              <SideBarResizeHandler onResizeStateChange={onResizeStateChange} />
            )}
          </div>
        </div>
      </SidebarContext.Provider>
    </Theme>
  )
}

function ToggleShowButtonWrapper({
  shouldExpand,
  setShouldExpand,
  toggleShowSideBar,
  showCollapseHint,
  dismissCollapseHint,
}: {
  shouldExpand: boolean
  setShouldExpand: React.Dispatch<React.SetStateAction<boolean>>
  toggleShowSideBar: () => void
  showCollapseHint: boolean
  dismissCollapseHint: () => void
}) {
  const logoContainerElement = useLogoContainerElement()
  const { sidebarToggleMode, sidebarPlacement } = useConfigs().value
  return (
    <Portal into={logoContainerElement}>
      <ToggleShowButton
        className={cx({
          hidden: shouldExpand,
        })}
        onHover={sidebarToggleMode === 'float' ? () => setShouldExpand(true) : undefined}
        onClick={toggleShowSideBar}
      >
        {showCollapseHint && !shouldExpand && (
          <CollapseHintPopover placement={sidebarPlacement} dismiss={dismissCollapseHint} />
        )}
      </ToggleShowButton>
    </Portal>
  )
}

function CollapseHintPopover({
  placement,
  dismiss,
}: {
  placement: Config['sidebarPlacement']
  dismiss: () => void
}) {
  const configContext = useConfigs()
  const onRight = placement === 'right'
  return (
    <Popover
      open
      caret={onRight ? 'right-top' : 'left-top'}
      sx={{
        position: 'absolute',
        top: 0,
        ...(onRight ? { right: '100%', mr: 2 } : { left: '100%', ml: 2 }),
      }}
    >
      <Popover.Content
        className={'gitako-collapse-hint'}
        sx={{ width: 232, padding: 2, fontSize: 0 }}
      >
        <Text as="p" sx={{ mt: 0, mb: 2 }}>
          Gitako collapsed because GitHub&apos;s own file tree is showing. Click the tentacle to
          reopen it.
        </Text>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box as="label" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 0 }}>
            <Checkbox
              className={'gitako-collapse-hint-never'}
              onChange={e => {
                if (e.target.checked) {
                  configContext.onChange({ neverShowSidebarAutoCollapseHint: true })
                  dismiss()
                }
              }}
            />
            Don&apos;t show again
          </Box>
          <Button className={'gitako-collapse-hint-dismiss'} size="small" onClick={dismiss}>
            Dismiss
          </Button>
        </Box>
      </Popover.Content>
    </Popover>
  )
}

function useFocusSidebarOnExpand(shouldExpand: boolean) {
  useEffect(() => {
    // prevent keeping focus within Gitako
    if (!shouldExpand) document.body.focus()
  }, [shouldExpand])
}

function useMarkGitakoGlobalAttributes() {
  useEffect(() => {
    const detach = DOMHelper.attachStickyGitakoPlatform()
    DOMHelper.markGitakoPlatform()
    return () => detach()
  }, [])
  useEffect(() => {
    const detach = DOMHelper.attachStickyGitakoReadyState()
    DOMHelper.markGitakoReadyState(true)
    return () => {
      detach()
      DOMHelper.markGitakoReadyState(false)
    }
  }, [])
}

function useLogoContainerElement() {
  const [logoContainerElement, setLogoContainerElement] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setLogoContainerElement(DOMHelper.insertLogoMountPoint())
  }, [])
  return logoContainerElement
}

function useUpdateBodyIndentOnStateUpdate(shouldExpand: boolean) {
  const { sidebarToggleMode, sidebarPlacement } = useConfigs().value
  useEffect(() => {
    if (!(sidebarToggleMode === 'persistent' && shouldExpand)) return

    const detach = DOMHelper.attachStickyBodyIndent()
    DOMHelper.setBodyIndent(sidebarPlacement)
    return () => {
      detach()
      DOMHelper.setBodyIndent(false)
    }
  }, [sidebarToggleMode, shouldExpand, sidebarPlacement])
}

const getDerivedExpansion = ({
  intelligentToggle,
  sidebarToggleMode,
  deferToNativeFileTree,
}: Pick<Config, 'intelligentToggle' | 'sidebarToggleMode' | 'deferToNativeFileTree'>) =>
  sidebarToggleMode === 'persistent'
    ? intelligentToggle === null // auto-expand checked
      ? platform.shouldExpandSideBar(deferToNativeFileTree)
      : intelligentToggle // read saved expand state
    : false // do not expand in float mode

function useGetDerivedExpansion() {
  const { intelligentToggle, sidebarToggleMode, deferToNativeFileTree } = useConfigs().value
  return useCallback(
    () => getDerivedExpansion({ intelligentToggle, sidebarToggleMode, deferToNativeFileTree }),
    [intelligentToggle, sidebarToggleMode, deferToNativeFileTree],
  )
}

function useUpdateBodyIndentAfterRedirect(
  update: (shouldExpand: boolean) => void,
  onAutoCollapseByNativeTree?: () => void,
  keyboardNavRef?: React.MutableRefObject<boolean>,
  setPendingFocusTarget?: (target: FocusTarget) => void,
) {
  const {
    intelligentToggle,
    sidebarToggleMode,
    sidebarPlacement,
    neverShowSidebarAutoCollapseHint,
    deferToNativeFileTree,
  } = useConfigs().value
  const updateForCurrentLocation = useCallback(() => {
    // check and update expand state if pinned and auto-expand checked
    if (sidebarToggleMode === 'persistent') {
      let shouldExpand = getDerivedExpansion({
        intelligentToggle,
        sidebarToggleMode,
        deferToNativeFileTree,
      })
      // The user is keyboard-navigating the tree and just opened this file.
      // Two independent things can drop focus out of the tree across the
      // redirect, so we counter both:
      //   1. Collapse — if the destination would auto-collapse (e.g. it shows
      //      GitHub's own file tree), `useFocusSidebarOnExpand` runs
      //      document.body.focus() on the way out. Keep the bar expanded so
      //      that never fires.
      //   2. Remount — a cross-context navigation changes the committed repo
      //      meta, which makes RepoContextWrapper flash its `disabled` state
      //      and tear down then rebuild SideBar. Re-arm the focus target so
      //      the rebuilt tree refocuses itself. This must run regardless of
      //      `shouldExpand`, otherwise a non-collapsing remount silently
      //      loses focus. (The remount itself re-seeds expand/focus from
      //      keyboardNavRef on mount; this branch covers the no-remount path.)
      // keyboardNavRef is a module singleton (see SidebarContext) so it stays
      // set across the several redirect events one navigation emits
      // (turbo:load + polling) and across the remount, and is only cleared
      // when the user switches to the mouse, so mouse-driven opens collapse
      // as before.
      if (keyboardNavRef?.current) {
        if (!shouldExpand) shouldExpand = true
        setPendingFocusTarget?.('files')
      }
      update(shouldExpand)
      // Below DOM mutation cannot be omitted, if do, body indent may get lost when shouldExpand is true for both before & after redirecting
      DOMHelper.setBodyIndent(shouldExpand && sidebarPlacement)
      // Auto-expand was on but we stayed collapsed because the host site is
      // showing its own file tree — surface a one-time hint so the silent
      // collapse isn't confusing.
      if (
        !shouldExpand &&
        intelligentToggle === null &&
        !neverShowSidebarAutoCollapseHint &&
        platform.isSideBarCollapsedByNativeFileTree?.(deferToNativeFileTree)
      ) {
        onAutoCollapseByNativeTree?.()
      }
    }
  }, [
    update,
    sidebarToggleMode,
    intelligentToggle,
    sidebarPlacement,
    neverShowSidebarAutoCollapseHint,
    deferToNativeFileTree,
    onAutoCollapseByNativeTree,
    keyboardNavRef,
    setPendingFocusTarget,
  ])

  // `turbo:load` can fire before this component registers its redirect
  // listener on an initial page load. Derive the same state once on mount so
  // initial rendering cannot miss native-tree auto-collapse (and its hint).
  // Later navigations continue to use the redirect hook.
  useEffect(updateForCurrentLocation, [updateForCurrentLocation])
  useAfterRedirect(updateForCurrentLocation)
}

// Save expand state on toggle if auto expand is off
function useSaveExpandStateOnToggle(shouldExpand: boolean) {
  const configContext = useConfigs()
  const { intelligentToggle } = configContext.value
  useEffect(() => {
    if (intelligentToggle !== null) configContext.onChange({ intelligentToggle: shouldExpand })
  }, [shouldExpand, intelligentToggle]) // eslint-disable-line react-hooks/exhaustive-deps
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
  useEffect(() => {
    if (hideSidebarOnInvalidToken) setShowSideBar(false)
  }, [hideSidebarOnInvalidToken, setShowSideBar])
}

function useShouldExpand(
  onAutoCollapseByNativeTree?: () => void,
  keyboardNavRef?: React.MutableRefObject<boolean>,
  setPendingFocusTarget?: (target: FocusTarget) => void,
) {
  const getDerivedExpansion = useGetDerivedExpansion()
  const error = useLoadedContext(SideBarErrorContext).value
  // When a keyboard-driven navigation remounts us, the destination may be a
  // page that would normally auto-collapse (e.g. a blob showing GitHub's own
  // file tree). Start expanded anyway so focus can stay in the tree; the user
  // is mid-keyboard-navigation. keyboardNavRef survives the remount because it
  // is a module singleton (see SidebarContext).
  const [shouldExpand, setShouldExpand] = useState(() =>
    keyboardNavRef?.current ? true : getDerivedExpansion(),
  )
  const toggleShowSideBar = useCallback(() => setShouldExpand(show => !show), [setShouldExpand])

  const $shouldExpand = error ? false : shouldExpand

  useSaveExpandStateOnToggle($shouldExpand)
  useUpdateBodyIndentOnStateUpdate($shouldExpand)
  useUpdateBodyIndentAfterRedirect(
    setShouldExpand,
    onAutoCollapseByNativeTree,
    keyboardNavRef,
    setPendingFocusTarget,
  )
  useCollapseOnNoPermissionWhenTokenHasBeenSet(setShouldExpand)

  return [$shouldExpand, setShouldExpand, toggleShowSideBar] as const
}

function useShowSidebarKeyboard(
  shouldExpand: boolean,
  setShouldExpand: React.Dispatch<React.SetStateAction<boolean>>,
  toggleShowSideBar: () => void,
  setFocusTarget: React.Dispatch<React.SetStateAction<FocusTarget>>,
) {
  const config = useConfigs().value

  useOnShortcutPressed(
    config.shortcut,
    useCallback(
      e => {
        DOMHelper.cancelEvent(e)
        toggleShowSideBar()
        if (!shouldExpand) setFocusTarget('files')
      },
      [shouldExpand, toggleShowSideBar, setFocusTarget],
    ),
  )

  useOnShortcutPressed(
    config.focusSearchInputShortcut,
    useCallback(
      e => {
        DOMHelper.cancelEvent(e)
        if (!shouldExpand) setShouldExpand(true)
        setFocusTarget('search')
      },
      [shouldExpand, setShouldExpand, setFocusTarget],
    ),
  )
}
