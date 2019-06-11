import { makeCodeStack, makeEventFilter, sortItemsByPriorityDESC, convertToAsyncFunction } from './utils.js'

export class Etx {
  constructor() {
    this.events = []
    this.isSilent = false
  }

  on(event, callback, priority = 10) {
    this.events.push({ event, callback, priority })
    return this
  }
  once(event, callback, priority = 10) {
    this.events.push({ event, callback, priority, once: 1 })
    return this
  }

  off(event, callback) {
    let events = this.events.filter(makeEventFilter(event))
    events.forEach((item, i) => {
      if (item.event === event && (callback === undefined || item.callback === callback)) {
        this.events.splice(i, 1)
      }
    })
    return this
  }

  silent(fn) {
    this.isSilent = true
    fn.call(this)
    this.isSilent = false
  }

  emit(event, ...args) {
    if (this.isSilent) {
      return
    }

    let events = this.events.filter(makeEventFilter(event))
    let items = sortItemsByPriorityDESC(events)

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
        origin: event,
        target: item.event,
        priority: item.priority,
        callback: item.callback,
        callback_index: i,
        callbacks_length: len,
        stop,
        passed_args: result,
        stack: makeCodeStack(),
      }
      result = item.callback(e, ...args)

      if (item.once) {
        this.off(item.event, item.callback)
      }
    }

    return result
  }

  // in series
  dispatch(event, ...args) {
    return new Promise((resolve, reject) => {
      let events = this.events.filter(makeEventFilter(event))
      let items = sortItemsByPriorityDESC(events)

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
          origin: event,
          target: item.event,
          priority: item.priority,
          callback: item.callback,
          callback_index: i,
          callbacks_length: len,
          stop,
          passed_args: params,
          stack: makeCodeStack(),
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

  // in parallel
  broadcast(event, ...args) {
    return new Promise((resolve, reject) => {
      let events = this.events.filter(makeEventFilter(event))
      let items = sortItemsByPriorityDESC(events)

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
          origin: event,
          target: item.event,
          priority: item.priority,
          callback: item.callback,
          callback_index: i,
          callbacks_length: len,
          stop,
          passed_args: args,
          stack: makeCodeStack(),
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
export default Etx
