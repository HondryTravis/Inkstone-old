
import { DOM } from '../dom/DOM';

class NativeSelection implements InkStone.ISelection {
  public dom = DOM
  public inkstone: any;
  public selection: Selection
  public range: Range
  constructor(){
    this.selection = window.getSelection();
  }
  inject(inkstone) {
    this.inkstone = inkstone
  }
  collapse(toStart: boolean = false) {
    const { selection } = this
    if(toStart) {
      selection.collapseToStart()
      return
    }
    selection.collapseToEnd()
  }
  setCursorLocation(parentNode: Node, offset?: number) {
    this.selection.collapse(parentNode, offset);
  }
  selectAllChildren(parentNode: Node) {
    this.selection.selectAllChildren(parentNode)
  }
}

export {
  NativeSelection
}
