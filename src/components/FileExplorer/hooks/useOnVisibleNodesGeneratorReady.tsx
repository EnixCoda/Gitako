import { platform } from 'platforms'
import { useEffect } from 'react'
import { VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'
import { useExpandTo } from './useExpandTo'
import { useFocusNode } from './useFocusNode'
import { useGoTo } from './useGoTo'
import { useToggleExpansion } from './useToggleExpansion'

export function useVisibleNodesGeneratorMethods(
  visibleNodesGenerator: VisibleNodesGenerator | null,
  getCurrentPath: () => string[] | null,
  updateSearchKey: React.Dispatch<React.SetStateAction<string>>,
) {
  const expandTo = useExpandTo(visibleNodesGenerator)
  const goTo = useGoTo(visibleNodesGenerator, updateSearchKey, expandTo)
  const toggleExpansion = useToggleExpansion(visibleNodesGenerator)
  const focusNode = useFocusNode(visibleNodesGenerator)
  useEffect(() => {
    if (!visibleNodesGenerator) return

    if (platform.shouldExpandAll?.()) {
      visibleNodesGenerator.onNextUpdate(visibleNodes =>
        visibleNodes.nodes.forEach(node => toggleExpansion(node, { recursive: true })),
      )
    } else {
      const targetPath = getCurrentPath()
      if (targetPath) goTo(targetPath)
    }
  }, [visibleNodesGenerator])

  return {
    expandTo,
    goTo,
    toggleExpansion,
    focusNode,
  }
}

export type VisibleNodesGeneratorMethods = ReturnType<typeof useVisibleNodesGeneratorMethods>
