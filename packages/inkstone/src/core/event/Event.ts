const NativeEvent = () => {
  const listeners = new Map()
  const on = (eventName, callback) => {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      if (Array.isArray(currentListener)) {
        currentListener.push(callback)
      }
    } else {
      listeners.set(eventName, [].concat(callback))
    }
  }
  const fire = (eventName, ...args) => {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      for (const callback of currentListener) {
        callback.call(null, ...args)
      }
    }
  }
  const removeListener = (eventName, callback) => {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      const idx = currentListener.indexOf(callback)
      if (idx && idx >= 0) {
        currentListener.splice(idx, 1)
      }
    }
  }
  const once = (eventName, callback) => {
    const execCalllback = function (...args) {
      callback.call(null, ...args)
      removeListener(eventName, execCalllback)
    }
    on(eventName, execCalllback)
  }
  const removeAllListeners = () => {
    listeners.clear()
  }
  const getAllListeners = () => {
    return listeners
  }
  const getListener = (key) => {
    return listeners.get(key)
  }

  const exports = {
    items: listeners,
    on,
    once,
    fire,
    getListener,
    getAllListeners,
    removeListener,
    removeAllListeners
  }
  return exports
}

export {
  NativeEvent
}
