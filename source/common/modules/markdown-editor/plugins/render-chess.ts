/**
  * @ignore
  * BEGIN HEADER
  *
  * Contains:        Chess rendering Plugin
  * CVM-Role:        CodeMirror Plugin
  * Maintainer:      Hendrik Erz
  * License:         GNU GPL v3
  *
  * Description:     This plugin renders chessboards.
  *
  * END HEADER
  */

import CodeMirror, { commands } from 'codemirror'
import { Chessboard } from 'cm-chessboard'

/**
 * Defines the CodeMirror command to render all found markdown images.
 * @param  {CodeMirror} cm The calling CodeMirror instance
 * @return {void}    Commands do not return.
 */
;(commands as any).markdownRenderChess = function (cm: CodeMirror.Editor) {
  let codeblock = [] // Holds a chess code block
  let currentCursorPosition = cm.getCursor('from').line

  // We'll only render the viewport
  const viewport = cm.getViewport()
  for (let i = viewport.from; i < viewport.to; i++) {
    if (cm.getModeAt({ 'line': i, 'ch': 0 }).name !== 'markdown-zkn') continue

    // Cursor is in here, so also don't render (for now)
    if (currentCursorPosition === i) continue

    if (/^```chess/.test(cm.getLine(i))) {
      codeblock = [] // Reset codeblock
      let startLine = i
      let endLine = i
      // Now read in all other lines one by one
      let cursorInBlock = false
      let j = i + 1 // Actually begin on the next line to exclude ```chess
      for (; j < cm.lineCount(); j++) {
        if (currentCursorPosition === j) {
          cursorInBlock = true
          break
        }
        if (/^```\s*$/.test(cm.getLine(j))) {
          // We're done reading in the codeblock
          endLine = j
          break
        }
        // Add the line to the codeblock
        codeblock.push(cm.getLine(j))
      }

      // Update the outer counter
      i = j++

      if (cursorInBlock) {
        codeblock = [] // Reset codeblock and continue
        continue
      }

      // We've got a codeblock! Let's perform some additional checks
      if (endLine <= startLine) continue

      const curFrom = { 'line': startLine, 'ch': 0 }
      const curTo = { 'line': endLine, 'ch': 3 }
      // We can only have one marker at any given position at any given time
      if (cm.findMarks(curFrom, curTo).length > 0) {
        continue
      }

      let code = codeblock.join('\n')
      let elem = document.createElement('div')
      elem.classList.add('chessboard')
      try {
        // eslint-disable-next-line no-new
        new Chessboard(elem, {
          position: code,
          sprite: { url: 'https://raw.githubusercontent.com/shaack/cm-chessboard/master/assets/images/chessboard-sprite.svg' }
        })
        // elem.onclick = clickAndSelect(view, this.node)
      } catch (err: any) {
        elem.classList.add('error')
        // TODO: Localise!
        elem.innerText = `Could not render Chessboard\n${err.str as string}`
      }

      // Now add a line widget to this line.
      let textMarker = cm.markText(
        { line: startLine, ch: 0 },
        { line: endLine, ch: 3 },
        {
          clearOnEnter: true,
          replacedWith: elem,
          handleMouseEvents: true
        }
      )
      elem.onclick = (e) => { textMarker.clear() }
    }
  }
}
