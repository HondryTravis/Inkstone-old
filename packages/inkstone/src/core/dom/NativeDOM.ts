
import NativeElement from './NativeElement'



const NativeDOM = (document, fragment_root) => {
  const fragment = fragment_root
  const dom = document

  const insertAfter = (target, current) => target.insertAdjacentElement('afterend', current)

  const insertBefore = (target, current) => target.insertAdjacentElement('beforebegin', current)

  const create = (tag: string, props: object, children?: []) => NativeElement.of({tag, props, children}).render()

  const hasClass = (node: Element, cls: string) => node.classList.contains(cls)

  const addClass = (node: Element, cls: string) => node.classList.add(cls)

  const removeClass = (node: Element, cls: string) => node.classList.remove(cls)

  const getStyle = (node: Element, name: string) => getComputedStyle(node)[name]

  const getNativeSelection = (root: Window | ShadowRoot) => root.getSelection()

  const getNativeRange = (root: Window | ShadowRoot) => {
    const selection = getNativeSelection(root)
    return selection.getRangeAt(0)
  }
  const setHTML = (node, html) => (node.innerHTML = html)

  const setText = (node, text) => (node.textContent = text)

  const add = (target, current) => target.appendChild(current)



  const exports = {
    fragment,
    add,
    setHTML,
    setText,
    create,
    addClass,
    hasClass,
    getStyle,
    removeClass,
    insertAfter,
    insertBefore,
    getNativeSelection,
    getNativeRange,
  }
  return exports
}

export {
  NativeDOM
}
