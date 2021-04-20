const createStore = (defaultState) =>{
  let current = defaultState || {}

  const setState = (newState) => {
    current = {
      ...current,
      ...newState
    }
  }
  const getState = () => current

  const exports = {
    setState,
    getState
  }
  return exports
}
