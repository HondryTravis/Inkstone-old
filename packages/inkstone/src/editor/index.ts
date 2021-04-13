import Components from '../core/components/index';
import InkStoneElement from '../core/components/InkStoneElement';

export default class Editor {
  container: InkStone.IContainer
  components: Map<any, any>;
  doc: InkStoneElement;
  listeners: any;
  core: any;
  settings: any
  constructor() {
    this.components = Components;
  }
  inject(key, ctor, isCore?) {
    if(isCore && isCore === true) {
      this.container = new ctor.Container
      this.listeners = ctor.createEventEmitter()
      this.core = ctor
    }
    this.container.bind(key, ctor, isCore)
  }
  fire(eventName, ...args) {
    this.listeners && this.listeners.fire(eventName, args)
  }
  on(eventName, callback) {
    this.listeners && this.listeners.on(eventName, callback)
  }
  setup(settings) {
    this.settings = settings
  }
  render() {
    const { selector } = this.settings
    const wrapper = document.querySelector(selector)
    let cache = wrapper.innerHTML
    this.doc = document.createElement('ink-stone') as InkStoneElement
    this.doc.inject(this)
    this.doc.setContent(cache)
    cache = null
    wrapper.innerHTML = ``
    wrapper.appendChild(this.doc)
  }
  destroy() {
    this.doc.remove()
  }
}
