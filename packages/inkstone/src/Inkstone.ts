import Core from './core'
import Editor from './editor'
import Test from './plugin/test'
export default class InkStone implements InkStone.IInkStone {
  container: InkStone.IContainer;
  settings: any
  editor: any;
  constructor() {
    this.container = Core.NativeContainer();

  }
  inject(key, ctor, isCore?) {
    const { container } = this
    container.bind(key, ctor, isCore)
  }
  use(key) {
    return this.container.use(key)
  }
  create() {
    const { container } = this

    this.editor = container.use('editor')

    const createInstance =() => {
      const instance = new this.editor.ctor()
      this.editor.instance = instance
      this.editor = instance
    }

    this.editor.instance ?? createInstance()
    this.editor.inject('core', this.use('core'), true)
    this.editor.setup(this.settings)
    const { settings } = this
    settings.plugins.forEach ( plugin => {
      const item = this.container.get(`${plugin}`)
      this.editor.inject(`${plugin}`, item.ctor)
    })
    return this
  }
  render() {

    this.editor.render()

    return this
  }
  setup(settings) {
    this.inject('core', Core, true)
    this.inject('editor', Editor)
    this.inject('test', Test)
    this.settings = settings
    return this
  }
  destroy() {
    this.editor.destroy()
  }
}
