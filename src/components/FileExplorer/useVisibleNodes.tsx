import { useEffect, useState } from 'react'
import { VisibleNodes, VisibleNodesGenerator } from 'utils/VisibleNodesGenerator'

export function useVisibleNodes(visibleNodesGenerator: VisibleNodesGenerator | null) {
  const [visibleNodes, setVisibleNodes] = useState<VisibleNodes | null>(
    visibleNodesGenerator?.visibleNodes || null,
  )
  useEffect(() => {
    const $visibleNodes = visibleNodesGenerator?.visibleNodes || null
    if (visibleNodes !== $visibleNodes) setVisibleNodes($visibleNodes)

    return visibleNodesGenerator?.onUpdate(setVisibleNodes)
  }, [visibleNodesGenerator]) // eslint-disable-line react-hooks/exhaustive-deps
  return visibleNodes
}
