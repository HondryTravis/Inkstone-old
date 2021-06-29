import NativeElement, { IOption } from "./element"

import { isDescendant } from '../../utils'

export function removeClass(node: Element, ...className: string[]) {
    return node.classList.remove(...className)
}

export function addClass(node: Element, ...className: string[]) {
    return node.classList.add(...className)
}

export function hasClass(node: Element, className: string) {
    return node.classList.contains(className)
}

export function insertAfter(target: Element, current: Element) {
    return target.insertAdjacentElement('afterend', current)
}

export function insertBefore(target: Element, current: Element) {
    return target.insertAdjacentElement('beforebegin', current)
}

export function query(selectors: keyof globalThis.HTMLElementTagNameMap) {
    return document.querySelector(selectors)
}

export function queryAll(selectors: keyof HTMLElementTagNameMap) {
    return document.querySelectorAll(selectors)
}

export function getStyle(node: Element, name: string) {
    return getComputedStyle(node)[name]
}

export function getSelection(root?: Window | HTMLIFrameElement | DocumentOrShadowRoot ) {
    if (!root) root = window

    if (root instanceof HTMLIFrameElement) return root.contentWindow.getSelection()

    return root.getSelection()
}

export function getActiveRange(root?: Window | HTMLIFrameElement | DocumentOrShadowRoot ) {
    let ret: Range;
    if (getSelection(root).rangeCount) {
        ret = getSelection().getRangeAt(0);
    } else {
        return null;
    }
    if ([Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.startContainer.nodeType) == -1
    || [Node.TEXT_NODE, Node.ELEMENT_NODE].indexOf(ret.endContainer.nodeType) == -1
    || !ret.startContainer.ownerDocument
    || !ret.endContainer.ownerDocument
    || !isDescendant(ret.startContainer, ret.startContainer.ownerDocument)
    || !isDescendant(ret.endContainer, ret.endContainer.ownerDocument)) {
        throw "Invalid active range; test bug?";
    }

    return ret
}

export function setText(node: Element, text: string) {
    node.textContent = text
}

export function setHTML(node: Element, html: string) {
    node.innerHTML = html
}

export function create({tagName, props, children}: IOption) {
    return NativeElement.create({tagName, props, children})
}

export function add(target: Element, current: Element) {
    target.appendChild(current)
}

export function remove(target: Element, current: Element) {
    target.appendChild(current)
}
