import { useConfigs } from 'containers/ConfigsContext'
import { platform } from 'platforms'
import { useCallback, useState } from 'react'
import { useCatchNetworkError } from 'utils/hooks/useCatchNetworkError'
import { useLoadedContext } from 'utils/hooks/useLoadedContext'
import { useSequentialEffect } from 'utils/hooks/useSequentialEffect'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { SideBarStateContext } from '../../../containers/SideBarState'

export function useVisibleNodesGenerator(metaData: MetaData) {
  const [visibleNodesGenerator, setVisibleNodesGenerator] = useState<VisibleNodesGenerator | null>(
    null,
  )

  const catchNetworkErrors = useCatchNetworkError()
  const config = useConfigs().value
  const accessToken = config.accessToken
  const setStateContext = useLoadedContext(SideBarStateContext).onChange

  useSequentialEffect(
    useCallback(
      checker => {
        catchNetworkErrors(async () => {
          if (!checker()) return

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
            accessToken,
          )
          if (!checker()) return

          setStateContext('tree-rendering')

          const visibleNodesGenerator = new VisibleNodesGenerator({
            root: treeRoot,
            defer,
            compress: config.compressSingletonFolder,
            async getTreeData(path) {
              const { root } = await platform.getTreeData(metaData, path, false, accessToken)
              return root
            },
          })

          setVisibleNodesGenerator(visibleNodesGenerator)

          setStateContext('tree-rendered')
        })
      },
      [metaData, accessToken],
    ),
  )

  return visibleNodesGenerator
}
