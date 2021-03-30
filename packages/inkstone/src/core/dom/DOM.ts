const DOM = function(doc: Document){

  let count = 0;

  const win = window

  const createRange = () => {

  }
  return {
    doc,
    win
  }
}

const insertAfter = (target, current) => {
  target.insertAdjacentElement('afterend', current)
}

const insertBefore = (target, current) => {
  target.insertAdjacentElement('beforebegin', current)
}

export {
  DOM,
  insertAfter,
  insertBefore
}
