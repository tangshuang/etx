export function sort(items) {
  items.sort((a, b) => {
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
}

export function makeCodeStack() {
  const e = new Error()
  const stack = e.stack || e.stacktrace
  const stacks = stack.split('\n')
  stacks.shift()
  stacks.shift()
  const text = stacks.join('\n')
  return text
}

export function toAsync(fn) {
  return  (...args) => {
    try {
      return Promise.resolve(fn(...args))
    }
    catch (e) {
      return Promise.reject(e)
    }
  }
}
