export default class Container implements InkStone.IContainer {
  private container: Map<string, any>
  constructor() {
    this.container = new Map()
  }
  add(name, module) {
    this.container.set(name, {
      singleton: false,
      instance: null,
      module: module
    })
    return this
  }
  use(name) {
    const current = this.container.get(name)
    if(current && current.instance) {
      return current.instance
    }
    return current
  }
  remove(name) {
    this.container.delete(name)
  }
  eachItem(callback: (value: any, key: string, map: Map<string, any>) => void): void {
    this.container.forEach(callback)
  }
}
