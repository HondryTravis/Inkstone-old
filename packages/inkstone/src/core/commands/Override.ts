



const createOverride = (getActiveRangeCallback) => {
  let stateOverrides:any = {};
  let valueOverrides:any = {};
  let storedRange:Range = null;

  const resetOverrides = () => {
    if (!storedRange
      || storedRange.startContainer != getActiveRangeCallback().startContainer
      || storedRange.endContainer != getActiveRangeCallback().endContainer
      || storedRange.startOffset != getActiveRangeCallback().startOffset
      || storedRange.endOffset != getActiveRangeCallback().endOffset) {
          stateOverrides = {};
          valueOverrides = {};
          storedRange = getActiveRangeCallback().cloneRange();
      }
  }

  const getStateOverride = (command) => {
    resetOverrides();
    return stateOverrides[command];
  };

  const setStateOverride = (command, newState) => {
    resetOverrides();
    stateOverrides[command] = newState;
  };

  const unsetStateOverride = (command) => {
    resetOverrides();
    delete stateOverrides[command];
  }

  const getValueOverride = (command) => {
    resetOverrides();
    return valueOverrides[command];
  }

  // backColor 命令的值替代必须与 hiliteColor 命令的值替代相同，以便设置一个将另一个设置同步，而取消设置也将同步设置
  const setValueOverride = (command, newValue) => {
    resetOverrides();
    valueOverrides[command] = newValue;
    if (command == "backcolor") {
      valueOverrides.hilitecolor = newValue;
    } else if (command == "hilitecolor") {
      valueOverrides.backcolor = newValue;
    }
  }

  const unsetValueOverride = (command) => {
    resetOverrides();
    delete valueOverrides[command];
    if (command == "backcolor") {
      delete valueOverrides.hilitecolor;
    } else if (command == "hilitecolor") {
      delete valueOverrides.backcolor;
    }
  }

  const exports = {
    resetOverrides,
    getStateOverride,
    setStateOverride,
    unsetStateOverride,
    getValueOverride,
    setValueOverride,
    unsetValueOverride
  }

  return exports
}


export {
  createOverride
}
