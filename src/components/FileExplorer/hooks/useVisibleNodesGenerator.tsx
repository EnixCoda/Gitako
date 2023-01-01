import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { useCallback, useState } from 'react'
import { useAbortableEffect } from 'utils/hooks/useAbortableEffect'
import { useHandleNetworkError } from 'utils/hooks/useHandleNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../../containers/SideBarState'

export function useVisibleNodesGenerator(metaData: MetaData | null) {
  const [visibleNodesGenerator, setVisibleNodesGenerator] = useState<VisibleNodesGenerator | null>(
    null,
  )

  const config = useConfigs().value
  const setStateContext = useLoadedContext(SideBarStateContext).onChange
  const handleNetworkError = useHandleNetworkError()

  // Only run when metadata or accessToken changes
  const createVNG = useCallback(
    async function* createVNG() {
      if (!metaData) return

      setStateContext('tree-loading')
      const { userName, repoName, branchName } = metaData
      try {
        const { root: treeRoot, defer = false } = yield await platform.getTreeData(
          {
            branchName,
            userName,
            repoName,
          },
          '/',
          true,
          config.accessToken,
        )
        setStateContext('tree-rendering')

        setVisibleNodesGenerator(
          new VisibleNodesGenerator({
            root: treeRoot,
            defer,
            compress: config.compressSingletonFolder,
            async getTreeData(path) {
              const { root } = await platform.getTreeData(metaData, path, false, config.accessToken)
              return root
            },
          }),
        )

        setStateContext('tree-rendered')
      } catch (err) {
        if (err instanceof Error) handleNetworkError(err)
        else throw err
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metaData, config.accessToken],
  )

  useAbortableEffect(
    useCallback(
      () => ({
        getAsyncGenerator: createVNG,
      }),
      [createVNG],
    ),
  )

  return visibleNodesGenerator
}
