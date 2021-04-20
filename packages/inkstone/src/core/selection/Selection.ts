
import Editor from '../../editor';

const NativeSelection = (editor: Editor) => {
  const { dom } = editor
  const { root } = dom.fragment
  const selection = dom.getNativeSelection(root)

  const collapse = (toStart: boolean = false) =>{
    if(toStart) {
      selection.collapseToStart()
      return
    }
    selection.collapseToEnd()
  }

  const setCursorLocation = (parentNode: Node, offset?: number) => {
    selection.collapse(parentNode, offset);
  }

  const selectAllChildren = (parentNode: Node) => {
    selection.selectAllChildren(parentNode)
  }

  const exports = {
    selection,
    collapse,
    setCursorLocation,
    selectAllChildren
  }

  return exports
}


export {
  NativeSelection
}
