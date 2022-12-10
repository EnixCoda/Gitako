import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { useCallback, useState } from 'react'
import { useAbortableEffect } from 'utils/hooks/useAbortableEffect'
import { useCatchNetworkError } from 'utils/hooks/useCatchNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../../containers/SideBarState'

export function useVisibleNodesGenerator(metaData: MetaData | null) {
  const [visibleNodesGenerator, setVisibleNodesGenerator] = useState<VisibleNodesGenerator | null>(
    null,
  )

  const catchNetworkErrors = useCatchNetworkError()
  const config = useConfigs().value
  const setStateContext = useLoadedContext(SideBarStateContext).onChange

  // Only run when metadata or accessToken changes
  useAbortableEffect(
    useCallback(
      signal => {
        catchNetworkErrors(async () => {
          if (!metaData) return
          if (signal.aborted) return

          setStateContext('tree-loading')
          const { userName, repoName, branchName } = metaData
          const { root: treeRoot, defer = false } = await platform.getTreeData(
            {
              branchName,
              userName,
              repoName,
            },
            '/',
            true,
            config.accessToken,
          )
          if (signal.aborted) return

          setStateContext('tree-rendering')

          setVisibleNodesGenerator(
            new VisibleNodesGenerator({
              root: treeRoot,
              defer,
              compress: config.compressSingletonFolder,
              async getTreeData(path) {
                const { root } = await platform.getTreeData(
                  metaData,
                  path,
                  false,
                  config.accessToken,
                )
                return root
              },
            }),
          )

          setStateContext('tree-rendered')
        })
      },
      [metaData, config.accessToken], // eslint-disable-line react-hooks/exhaustive-deps
    ),
  )

  return visibleNodesGenerator
}
