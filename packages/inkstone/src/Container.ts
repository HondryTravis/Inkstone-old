interface INewAble<T> {
  new(...args: any[]): T
}

interface IContainer {
  callback(...args: any[]): {}
  singleton: boolean
  instance?: {}
}

export default class Container {
  private container: Map<PropertyKey, IContainer>
  constructor() {
      this.container = new Map<string, IContainer>()
  }
  bind<T>(key: string, newFn: INewAble<T>) {
      const callback = (...args) => new newFn(...args)
      this.container.set(key, {callback, singleton: false})
  }
  use<T>(namespace: string, ...args: any) {
      let item = this.container.get(namespace)
      if(item !== undefined) {
          if(item.singleton && !item.instance){
              item.instance = item.callback()
          }
      } else {
          throw new Error('not found this instance which in container');
      }
      return item.singleton ? <T>item.instance : (<T>item?.callback(...args))
  }
  restore(key: string) {
      this.container.delete(key)
  }
}
