import Components from './components/index';
import InkStoneElement from './components/InkStoneElement';
import * as Constants from './constant'
export default class Editor {
  container: InkStone.IContainer
  components: Map<any, any>;
  fragment_root: InkStoneElement;
  listeners: any;
  dom: any;
  core: any;
  selection: any;
  utils: any
  settings: any
  constructor() {
    this.components = Components;
  }
  inject(key, ctor, isCore?) {
    if(isCore && isCore === true) {
      this.core = ctor
      this.container = this.core.NativeContainer()
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
    this.init()
    const { selector } = this.settings
    const wrapper = document.querySelector(selector)
    let node
    while(node = wrapper.firstChild) {
      this.fragment_root.add(node)
    }
    this.dom.add(wrapper, this.fragment_root)
    this.fire(Constants.EDITOR_INIT, this)
  }
  init() {
    this.fragment_root = document.createElement('ink-stone') as InkStoneElement
    this.fragment_root.inject(this)
    this.dom = this.core.NativeDOM(document, this.fragment_root)
    this.listeners = this.core.NativeEvent()
    this.selection = this.core.NativeSelection(this)
    this.utils = this.core.Utils
    this.container.eachItem((item) => {
      !item.isCore && (item.instance ?? (item.instance = new item.ctor(this)))
    })
  }
  destroy() {
    this.fragment_root.remove()
  }
}
