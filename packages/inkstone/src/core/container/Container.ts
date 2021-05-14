
type ICallbackFn = (value: any, key: string, map: Map<string, any>) => void
const NativeContainer = (): InkStone.IContainer => {
    const container = new Map()

    const bind = (key, ctor, isCore?: boolean) => {
        (key && ctor) && container.set(key, {
            isCore: isCore ?? false,
            singleton: true,
            instance: null,
            ctor: ctor ?? null,
        })
    }

    const use = (key) => {
        const current = container.get(key)
        return current
            && (current.isCore
                ? current.ctor
                : ((current.instance) ?? current)
            )
    }

    const eachItem = (callback: ICallbackFn, thisArg?: any) => {
        callback && container.forEach(callback, thisArg)
    }

    const has = (key: string) => container.has(key)
    const get = (key: string) => container.get(key)
    const remove = (key: string) => container.delete(key)
    const clear = () => container.clear()

    const exports = {
        items: container,
        bind,
        use,
        has,
        get,
        remove,
        eachItem,
        clear
    }

    return exports
}

export {
    NativeContainer
}


