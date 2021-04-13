import Core from './core'
import Editor from './editor'

export default class InkStone implements InkStone.IInkStone {
  container: InkStone.IContainer;
  settings: any
  editor: any;
  constructor() {
    this.container = new Core.Container();
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

    this.editor = container.use('Editor')

    const createInstance =() => {
      const instance = new this.editor.ctor()
      this.editor.instance = instance
      this.editor = instance
    }

    this.editor.instance ?? createInstance()
    this.editor.inject('Core', this.use('Core'), true)
    this.editor.setup(this.settings)
    return this
  }
  render() {

    this.editor.render()

    return this
  }
  setup(settings) {
    this.inject('Core', Core, true)
    this.inject('Editor', Editor)
    this.settings = settings
    return this
  }
  destroy() {
    this.editor.destroy()
  }
}
