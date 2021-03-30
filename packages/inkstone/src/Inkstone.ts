import { MODULE_LOADED } from './core/constant/index';

import {
  Editor,
  NativeSelection,
  createEventEmitter,
  Container,
  Constant
} from './core'


export default class Inkstone implements InkStone.IInkStone {
  container: InkStone.IContainer;
  eventListeners = createEventEmitter();
  settings: any;
  editor: any
  constructor() {
    this.container = new Container();
    this.inject('Editor', Editor)
    this.inject('NativeSelection', NativeSelection)
  }
  inject(key, module) {
    const { container } = this
    container.add(key, module)
  }
  fire(key, ...args) {
    this.eventListeners.fire(key, ...args)
  }
  on(key, callback) {
    this.eventListeners.on(key, callback)
  }
  create() {
    const { container } = this

    container.eachItem((item) => {
      if(!item.instance && !item.singleton) {
        item.instance = new item.module()
        item.instance.inject(this)
      }
    })

    this.fire(Constant.MODULE_LOADED, {inkstone: this})

    this.editor = container.use('Editor')

    if(!this.editor) {
      throw console.error('init faild')
    }

    this.editor.render()

    return this
  }
  destroy() {
    this.editor.destroy()
  }
  setup(settings) {
    this.settings = settings
    return this
  }
}
