
import { DOMUtils, IDOMUtils} from '../dom/DOMUtils';


interface ISelection {

}


const Selection = function(test): ISelection {

  let doc: IDOMUtils

  let current = test

  let currentInkstone = null

  const currentSelection: globalThis.Selection = window.getSelection()

  function setup(inkstone) {
    currentInkstone = inkstone || null
  }

  function collapse(toStart: boolean = false) {
    if(toStart) {
      currentSelection.collapseToStart()
      return
    }
    currentSelection.collapseToEnd()
  }

  function getSelectedNode(parentNode, offset?) {

  }

  function setCursorLocation(parentNode: Node, offset?: number): void {
    currentSelection.collapse(parentNode, offset);
  }

  function getContent() {

  }

  function selectAllChildren(parentNode) {
    currentSelection.selectAllChildren(parentNode)
  }

  function getSelection() {
    return currentSelection
  }

  return {
    current,
    setup,
    collapse,
    getSelectedNode,
    selectAllChildren,
    setCursorLocation,
    getSelection
  }
}

export {
  Selection
}
