
import Editor from '../../editor';

const NativeSelection = (editor: Editor) => {
  const { dom, utils, fragment_root } = editor
  const { root } = dom.fragment

  // 当前编辑器的全局 range
  let internalRange = null

  let extraRanges = [];

  // magic, I don't know if this is great 直接覆盖好吗？
  const getSelection = function (): Selection {
    return (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        && root.getSelection())
        || window.getSelection()
  }

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
        throw "Invalid active range in getNavtiveRange; test bug? 魔法？";
    }
    return ret;
  }

  const setNativeRange = (range) => {
    internalRange = range
  }

  const collapse = (toStart: boolean = false) =>{
    return toStart ? getSelection().collapseToStart() : getSelection().collapseToEnd()
  }

  const setCursorLocation = (parentNode: Node, offset?: number) => getSelection().collapse(parentNode, offset);

  const selectAllChildren = (parentNode: Node) => getSelection().selectAllChildren(parentNode)

  const exports = {
    range: internalRange,
    selection: getSelection(),
    root,
    collapse,
    getNavtiveRange,
    setNativeRange,
    setCursorLocation,
    selectAllChildren,
    getSelection
  }

  return exports
}


export {
  NativeSelection
}
