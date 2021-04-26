

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
  }
  inject(inkstone) {
    this.inkstone = inkstone
  }
  iniSetup() {
    this.style.display = 'block'
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
  add(node) {
    this.current.appendChild(node)
  }
}

customElements.define('ink-stone', InkStoneElement);
