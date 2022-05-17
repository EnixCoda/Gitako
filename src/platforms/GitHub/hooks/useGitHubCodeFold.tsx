import { platform } from 'platforms'
import { useCallback, useEffect } from 'react'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { GitHub } from '..'

const theCSSClassMark = 'gitako-code-fold-attached'
const theCSSClassMarkWhenDisabled = 'gitako-code-fold-attached-disabled'
const theCSSClassForHiddenLine = 'gitako-code-fold-hidden'
const theCSSClassForToggleElement = 'gitako-code-fold-handler'
const tableSelector = `.blob-wrapper table`
const selectorOfLineNumber = `.blob-num`
const selectorOfLineContent = `.blob-code`

const theCSSClassForToggleElementOnActive = 'gitako-code-fold-active'
function init() {
  type LineNumber = number // alias
  const blocks: LineNumber[] = [] // startLine -> exclusiveEndLine
  /**
   * For example, given such input
   *
   * 0 |∇ line1
   * 1 |∇   line2
   * 2 |
   * 3 |∇   line3
   * 4 |      line4
   * 5 |  line5
   *
   * blocks will be
   * 0 -> 5
   * 1 -> 3
   * 2
   * 3 -> 5
   * 4
   * 5
   */

  const table = document.querySelector(tableSelector)
  const lineElements = Array.from(document.querySelectorAll([tableSelector, 'tr'].join(' ')))
  if (!table || !lineElements.length) return
  if (table.classList.contains(theCSSClassMark)) {
    if (table.classList.contains(theCSSClassMarkWhenDisabled)) {
      // reactivate
      table.classList.remove(theCSSClassMarkWhenDisabled)
    }
    return
  }
  table.classList.add(theCSSClassMark)

  // setup blocks
  {
    type Level = number // measured by leading whitespace amount
    const stack: [Level, LineNumber][] = []

    const trySeal = (lineNumber: number, level: number) => {
      let ignoredTheHighestLevelItem = false
      while (stack.length) {
        const top = stack.pop()
        if (top === undefined) throw new Error()
        const [$LineNumber, $level] = top

        if ($level < level) {
          stack.push(top)
          break
        } else if (!ignoredTheHighestLevelItem) {
          ignoredTheHighestLevelItem = true
        } else {
          blocks[$LineNumber] = lineNumber
        }
      }
      stack.push([lineNumber, level])
    }

    lineElements.forEach((element, lineNumber) => {
      const text = element.querySelector(selectorOfLineContent)?.textContent || null
      if (text === null) return

      const level = getTextLevel(text)
      if (level === -1) return

      trySeal(lineNumber, level)
    })

    trySeal(lineElements.length, -1)
  }

  // attach toggle buttons
  blocks.forEach((end, line) => {
    if (!end) return

    const toggleElement = document.createElement('div')
    toggleElement.setAttribute('title', 'Code Folding by Gitako')
    toggleElement.setAttribute('role', 'button')
    toggleElement.classList.add(theCSSClassForToggleElement)

    const lineNumberElement = lineElements[line].querySelector(selectorOfLineNumber)
    lineNumberElement?.appendChild(toggleElement)
  })

  const foldLines = new Set<LineNumber>()
  function toggleLine(line: number) {
    // const lineElements = Array.from(document.querySelectorAll(lineSelector))
    const element = lineElements[line]
    element.classList.toggle(theCSSClassForToggleElementOnActive)
    if (foldLines.has(line)) {
      foldLines.delete(line)
    } else {
      foldLines.add(line)
    }

    const linesToHide = new Set<LineNumber>()
    for (const line of foldLines.values()) {
      const end = blocks[line]
      for (let $line = line + 1; $line < end; $line++) linesToHide.add($line)
    }

    lineElements.forEach((element, i) => {
      if (linesToHide.has(i)) element.classList.add(theCSSClassForHiddenLine)
      else element.classList.remove(theCSSClassForHiddenLine)
    })
  }

  table.addEventListener('click', e => {
    if (e.target instanceof HTMLElement) {
      if (e.target.classList.contains(theCSSClassForToggleElement)) {
        const tr = e.target.parentElement?.parentElement
        if (tr) {
          toggleLine(lineElements.indexOf(tr))
          e.stopPropagation()
        }
      }
    }
  })
}

function cancelToggleFeature() {
  const table = document.querySelector(tableSelector)
  table?.classList.add(theCSSClassMarkWhenDisabled)
}

function getTextLevel(text: string) {
  const leading = countLeadingWhitespace(text)
  return leading === text.length ? -1 : leading
}

function countLeadingWhitespace(text: string) {
  let i = 0
  for (; i < text.length; i++) {
    // Mixed usage of space and table indentation? ¯\_(ツ)_/¯
    if (!(text[i] === ' ' || text[i] === '\t' || text[i] === '\n')) break
  }
  return i
}

export function useGitHubCodeFold(active: boolean) {
  const effect = useCallback(() => {
    if (platform !== GitHub) return
    if (active) {
      init()
      return () => cancelToggleFeature()
    }
  }, [active])
  useEffect(effect, [effect])
  useOnPJAXDone(effect)
}
