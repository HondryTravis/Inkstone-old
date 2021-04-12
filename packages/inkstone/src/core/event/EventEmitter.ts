function createEventEmitter() {
  const listeners = new Map()
  function on(eventName, callback) {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      if (Array.isArray(currentListener)) {
        currentListener.push(callback)
      }
    } else {
      listeners.set(eventName, [].concat(callback))
    }
  }
  function fire(eventName, ...args) {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      for (const callback of currentListener) {
        callback.call(null, ...args)
      }
    }
  }
  function removeListener(eventName, callback) {
    if (listeners.has(eventName)) {
      const currentListener = listeners.get(eventName)
      const idx = currentListener.indexOf(callback)
      if (idx && idx >= 0) {
        currentListener.splice(idx, 1)
      }
    }
  }
  function once(eventName, callback) {
    const execCalllback = function (...args) {
      callback.call(null, ...args)
      removeListener(eventName, execCalllback)
    }
    on(eventName, execCalllback)
  }
  function removeAllListeners() {
    listeners.clear()
  }
  function getAllListeners() {
    return listeners
  }
  function getListener(key) {
    return listeners.get(key)
  }
  return {
    on,
    once,
    fire,
    getListener,
    getAllListeners,
    removeListener,
    removeAllListeners
  }
}

export {
  createEventEmitter
}
