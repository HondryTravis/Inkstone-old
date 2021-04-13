
type ICallbackFn = (value: any, key: string, map: Map<string, any>) => void
export default class Container implements InkStone.IContainer {
  private container: Map<string, any>
  constructor() {
    this.container = new Map()
  }
  bind(name, ctor, isCore?: boolean) {
    (name && ctor) && this.container.set(name, {
      isCore: isCore ?? false,
      singleton: true,
      instance: null,
      ctor: ctor ?? null
    })
    return this
  }
  use(name) {
    const current = this.container.get(name)
    return current
      && (current.isCore
        ? current.ctor
        : ((current.instance) ?? current)
      )
  }
  remove(name) {
    this.container.delete(name)
  }
  eachItem(callback: ICallbackFn, thisArg?: any) {
    callback && this.container.forEach(callback, thisArg)
    return this
  }
}
