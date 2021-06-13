
export default class InkStoneElement extends HTMLElement {

    inkstone: InkStone.IInkStone
    current: HTMLElement

    constructor() {
        super();

        this.current = document.createElement('div');

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.append(this.current)
    }

    connectedCallback() {
        this.setup()
    }

    inject(inkstone) {
        this.inkstone = inkstone
    }

    preset() {
        this.setMode('true');

        // init style
        this.style.display = 'block'
        this.current.style.outline = 'none'
    }

    setup() {
        this.preset()
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
        this.current.append(node)
    }
}

customElements.define('ink-stone', InkStoneElement);
