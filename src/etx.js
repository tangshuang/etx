import { makeCodeStack, makeEventFilter, sortItemsByPriorityDESC, convertToAsyncFunction } from './utils.js'

export class Etx {
  constructor() {
    this._events = []
    this._isSilent = false
  }

  on(event, callback, priority = 10) {
    this._events.push({ event, callback, priority })
    return this
  }
  once(event, callback, priority = 10) {
    this._events.push({ event, callback, priority, once: 1 })
    return this
  }

  off(event, callback) {
    const events = this._events.filter(makeEventFilter(event))
    events.forEach((item, i) => {
      if (item.event === event && (callback === undefined || item.callback === callback)) {
        this._events.splice(i, 1)
      }
    })
    return this
  }

  has(event) {
    const existing = this._events.find(makeEventFilter(event))
    return !!existing
  }

  silent(fn) {
    this._isSilent = true
    fn.call(this)
    this._isSilent = false
  }

  emit(event, ...args) {
    if (this._isSilent) {
      return
    }

    const events = this._events.filter(makeEventFilter(event))
    const items = sortItemsByPriorityDESC(events)

    let isStoped = false
    const stop = () => {
      isStoped = true
    }

    let result = args
    for (let i = 0, len = items.length; i < len; i ++) {
      if (isStoped) {
        break
      }

      const item = items[i]
      const e = {
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
      const events = this._events.filter(makeEventFilter(event))
      const items = sortItemsByPriorityDESC(events)

      let i = 0
      const len = items.length
      let isStoped = false
      const stop = () => {
        isStoped = true
      }

      const through = (params) => {
        if (isStoped) {
          reject()
          return
        }

        const item = items[i]
        if (i === len) {
          resolve(params)
          return
        }

        const e = {
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
        const fn = convertToAsyncFunction(item.callback)

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
      const events = this._events.filter(makeEventFilter(event))
      const items = sortItemsByPriorityDESC(events)

      let isStoped = false
      const stop = () => {
        isStoped = true
      }

      const promises = []
      for (let i = 0, len = items.length; i < len; i ++) {
        if (isStoped) {
          reject()
          return
        }

        const item = items[i]
        const e = {
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
        const fn = convertToAsyncFunction(item.callback)
        const defer = fn(e, ...args)
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
    this._events.length = 0
  }
}
export default Etx
