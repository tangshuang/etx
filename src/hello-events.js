function sortItemsByPriorityDESC(items) {
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

function convertToAsyncFunction(fn) {
  return (...args) => {
    try {
      return Promise.resolve(fn(...args))
    }
    catch(e) {
      return Promise.reject(e);
    }
  }
}

const namespaces = {}

export default class HelloEvents {
  constructor(ns) {
    if (ns) {
      this.events = namespaces[ns] = namespaces[ns] || []
    }
    else {
      this.events = []
    }
  }
  on(event, callback, priority = 10) {
    this.events.push({ event, callback, priority })
  }
  once(event, callback, priority = 10) {
    this.events.push({ event, callback, priority, once: 1 })
  }
  off(event, callback) {
    this.events.forEach((item, i) => {
      if (item.event === event && (callback === undefined || item.callback === callback)) {
        this.events.splice(i, 1)
      }
    })
  }
  emit(event, ...args) {
    let items = this.events.filter(item => item.event === event)
    sortItemsByPriorityDESC(items)

    let isStoped = false
    let stop = () => {
      isStoped = true
    }

    let result = args
    for (let i = 0, len = items.length; i < len; i ++) {
      if (isStoped) {
        break
      }

      let item = items[i]
      let e = {
        name: item.event,
        priority: item.priority,
        callback: item.callback,
        callback_index: i,
        callback_length: len,
        stop,
        passed_args: result,
      }
      result = item.callback(e, ...args)

      if (item.once) {
        this.off(item.event, item.callback)
      }
    }

    return result
  }
  dispatch(event, ...args) {
    return new Promise((resolve, reject) => {
      let items = this.events.filter(item => item.event === event)
      sortItemsByPriorityDESC(items)

      let i = 0
      let len = items.length
      let isStoped = false
      let stop = () => {
        isStoped = true
      }

      let through = (params) => {
        if (isStoped) {
          reject()
          return
        }

        let item = items[i]
        if (i === len) {
          resolve(params)
          return
        }

        let e = {
          name: item.event,
          priority: item.priority,
          callback: item.callback,
          callback_index: i,
          callback_length: len,
          stop,
          passed_args: params,
        }
        let fn = convertToAsyncFunction(item.callback)

        if (item.once) {
          this.off(item.event, item.callback)
        }

        i ++
        fn(e, ...args).then(through).catch(reject)
      }
      through(args)
    })
  }
  confluer(event, ...args) {
    return new Promise((resolve, reject) => {
      let items = this.events.filter(item => item.event === event)
      sortItemsByPriorityDESC(items)

      let isStoped = false
      let stop = () => {
        isStoped = true
      }

      let promises = []
      for (let i = 0, len = items.length; i < len; i ++) {
        if (isStoped) {
          reject()
          return
        }

        let item = items[i]
        let e = {
          name: item.event,
          priority: item.priority,
          callback: item.callback,
          callback_index: i,
          callback_length: len,
          stop,
          passed_args: args,
        }
        let fn = convertToAsyncFunction(item.callback)
        let defer = fn(e, ...args)
        promises.push(defer)

        if (item.once) {
          this.off(item.event, item.callback)
        }
      }

      Promise.all(promises).then(resolve).catch(reject)
    })
  }
  destroy() {
    // remove all events from global namespace
    // developers should must do this if they use namespace
    // or they will face memory stack overflow
    this.events.length = 0
  }
}
