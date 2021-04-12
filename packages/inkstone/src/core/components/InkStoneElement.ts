import { insertAfter, insertBefore } from '../dom/DOM'


export default class InkStoneElement extends HTMLElement {
  inkstone: InkStone.IInkStone
  root: ShadowRoot;
  current: HTMLElement
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.current = document.createElement('div');
    this.root.append(this.current)
    this.setMode('true');
  }
  connectedCallback() {
    this.iniSetup()
    this.inkstone.fire('Init')
  }
  inject(inkstone) {
    this.inkstone = inkstone
  }
  iniSetup() {
    this.inkstone.fire('LoadSkins')
    this.initEvent()
  }
  initEvent() {

  }
  setMode(mode: string) {
    this.current.contentEditable = mode
  }
  setContent(html) {
    this.current.innerHTML = html
  }
}


customElements.define('ink-stone', InkStoneElement);