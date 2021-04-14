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
    const { selector } = this.settings
    const wrapper = document.querySelector(selector)
    this.fragment_root = document.createElement('ink-stone') as InkStoneElement
    this.fragment_root.inject(this)
    this.dom = this.core.NativeDOM(document, this.fragment_root)
    this.listeners = this.core.NativeEvent()
    this.selection = this.core.NativeSelection(this)
    this.utils = this.core.Utils
    this.container.eachItem((item) => {
      !item.isCore && (item.instance ?? (item.instance = new item.ctor(this)))
    })
    let node
    console.dir(wrapper)
    while(node = wrapper.firstChild) {
      console.log(node)
      this.dom.add(this.fragment_root, node)
    }
    console.log(this.fragment_root)
    // this.dom.add(wrapper, this.fragment_root)
    console.log(this.listeners)
    this.fire(Constants.EDITOR_INIT, this)
  }
  destroy() {
    this.fragment_root.remove()
  }
}
