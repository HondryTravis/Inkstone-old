

export interface IDOMUtils {

}

const DOMUtils = function(): IDOMUtils {

  const doc = Document

  function createRange() {
    return doc
  }

  return {
    doc
  }
}


export {
  DOMUtils
}
