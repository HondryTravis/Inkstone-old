
import Editor from '../../editor';

const NativeSelection = (editor: Editor) => {
  const { dom, utils } = editor
  const { root } = dom.fragment

  // 当前编辑器的全局 range
  let internalRange = null

  const selection = dom.getNativeSelection(root)

  const getNavtiveRange = () => {
    let ret: Range;
    if(internalRange) {
      ret = internalRange;
    } else if(getSelection().rangeCount) {
      ret = getSelection().getRangeAt(0);
    } else {
      return null;
    }
    if ([Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.startContainer.nodeType) == -1
    || [Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.endContainer.nodeType) == -1
    || !ret.startContainer.ownerDocument
    || !ret.endContainer.ownerDocument
    || !utils.isDescendant(ret.startContainer, ret.startContainer.ownerDocument)
    || !utils.isDescendant(ret.endContainer, ret.endContainer.ownerDocument)) {
        throw "Invalid active range; test bug?";
    }
    return ret;
  }

  const setNativeRange = (range) => {
    internalRange = range
  }

  const collapse = (toStart: boolean = false) =>{
    return (toStart && selection.collapseToStart()) || selection.collapseToEnd()
  }

  const setCursorLocation = (parentNode: Node, offset?: number) => selection.collapse(parentNode, offset);

  const selectAllChildren = (parentNode: Node) => selection.selectAllChildren(parentNode)

  const exports = {
    range: internalRange,
    selection,
    collapse,
    getNavtiveRange,
    setNativeRange,
    setCursorLocation,
    selectAllChildren
  }

  return exports
}


export {
  NativeSelection
}
