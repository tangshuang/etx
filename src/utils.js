export const sortItemsByPriorityDESC = (items) => {
  const results = [...items]
  results.sort((a, b) => {
    if (a.priority > b.priority) {
      return -1
    }
    else if (a.priority < b.priority) {
      return 1
    }
    else {
      return 0
    }
  })
  return results
}

export const convertToAsyncFunction = (fn) => (...args) => {
  try {
    return Promise.resolve(fn(...args))
  }
  catch(e) {
    return Promise.reject(e);
  }
}

export const makeCodeStack = () => {
  let e = new Error()
  let stack = e.stack || e.stacktrace
  let stacks = stack.split('\n')
  stacks.shift()
  stacks.shift()
  stack = stacks.join('\n')
  return stack
}

export const makeEventFilter = (event) => (item) => {
  let meet = item.event.split('.').filter(item => !!item).join('.')
  if (meet === '*') {
    return true
  }
  if (meet === event) {
    return true
  }

  // for example: meet='click.custom' by `on` & event='click' by `emit`
  if (meet.indexOf(event + '.') === 0) {
    return true
  }

  return false
}
