class Container {
    constructor() {
        this.container = new Map();
    }
    bind(key, newFn) {
        const callback = (...args) => new newFn(...args);
        this.container.set(key, { callback, singleton: false });
    }
    use(namespace, ...args) {
        let item = this.container.get(namespace);
        if (item !== undefined) {
            if (item.singleton && !item.instance) {
                item.instance = item.callback();
            }
        }
        else {
            throw new Error('not found this instance which in container');
        }
        return item.singleton ? item.instance : item?.callback(...args);
    }
    restore(key) {
        this.container.delete(key);
        console.log(2222);
    }
}

const InkStone = 'hello inkstone';

export { Container, InkStone };
