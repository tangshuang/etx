export class Etx {
  constructor() {
    this._listeners = []
    this._isSilent = false
    this._isSecret = false
  }

  on(event, callback, priority = 10) {
    if (Array.isArray(event)) {
      const events = event
      events.forEach((event) => {
        this.on(event, callback, priority)
      })
      return this
    }

    this._listeners.push({ event, callback, priority })
    sort(this._listeners)
    return this
  }
  once(event, callback, priority = 10) {
    if (Array.isArray(event)) {
      const events = event
      events.forEach((event) => {
        this.once(event, callback, priority)
      })
      return this
    }

    this._listeners.push({ event, callback, priority, once: 1 })
    sort(this._listeners)
    return this
  }

  off(event, callback) {
    if (Array.isArray(event)) {
      const events = event
      events.forEach((event) => {
        this.off(event, callback, priority)
      })
      return this
    }

    this._listeners.forEach((item, i) => {
      if (item.event === event && (callback === undefined || item.callback === callback)) {
        this._listeners.splice(i, 1)
      }
    })
    return this
  }

  isListening(event, callback) {
    if (Array.isArray(event)) {
      const events = event
      for (let i = 0, len = events.length; i < len; i ++) {
        const event = events[i]
        if (!this.isListening(event, callback)) {
          return false
        }
      }
      return true
    }

    const existing = this._listeners.find(item => item.event === event && (callback === undefined || item.callback === callback))
    return !!existing
  }

  silent(fn) {
    if (typeof fn === 'boolean') {
      this._isSilent = fn
      return
    }

    this._isSilent = true
    const defer = fn.call(this)
    this._isSilent = false
    return defer
  }

  secret(fn) {
    if (typeof fn === 'boolean') {
      this._isSecret = fn
      return
    }

    this._isSecret = true
    const defer = fn.call(this)
    this._isSecret = false
    return defer
  }

  emit(broadcast, event, ...args) {
    if (this._isSilent) {
      return
    }

    if (typeof broadcast !== 'boolean') {
      args.unshift(event)
      event = broadcast
      broadcast = false
    }

    const events = this._listeners.filter(item => item.event === event)
    const isSecret = this._isSecret
    const parents = isSecret ? [] : this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
    const children = broadcast && !isSecret ? this._listeners.filter(item => item.event.indexOf(event + '.') === 0) : []
    const roots = isSecret ? [] : this._listeners.filter(item => item.event === '*')

    let isPreventDefault = false
    let isStopPropagation = false
    let isStopImmediatePropagation = false

    const preventDefault = () => { isPreventDefault = true }
    const stopPropagation = () => { isStopPropagation = true }
    const stopImmediatePropagation = () => { isStopImmediatePropagation = true }

    const callback = (item) => {
      const e = {
        target: event,
        event: item.event,
        priority: item.priority,
        callback: item.callback,
        broadcast,
        preventDefault,
        stopPropagation,
        stopImmediatePropagation,
        stack: makeCodeStack(),
      }

      if (item.once) {
        this.off(item.event, item.callback)
      }

      item.callback(e, ...args)
    }

    // trigger
    for (let i = 0, len = events.length; i < len; i ++) {
      if (isPreventDefault) {
        break
      }

      if (isStopImmediatePropagation) {
        break
      }

      const item = events[i]
      callback(item)
    }

    // propagate
    const relatives = [...children, ...parents]
    for (let i = 0, len = relatives.length; i < len; i ++) {
      if (isStopPropagation) {
        break
      }

      if (isStopImmediatePropagation) {
        break
      }

      const item = relatives[i]
      callback(item)
    }

    // touch
    for (let i = 0, len = roots.length; i < len; i ++) {
      if (isStopImmediatePropagation) {
        break
      }

      const item = roots[i]
      callback(item)
    }
  }

  // in series
  dispatch(broadcast, event, ...args) {
    return new Promise((resolve, reject) => {
      if (this._isSilent) {
        return resolve()
      }

      if (typeof broadcast !== 'boolean') {
        args.unshift(event)
        event = broadcast
        broadcast = false
      }

      const events = this._listeners.filter(item => item.event === event)
      const isSecret = this._isSecret
      const parents = isSecret ? [] : this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
      const children = broadcast && !isSecret ? this._listeners.filter(item => item.event.indexOf(event + '.') === 0) : []
      const roots = isSecret ? [] : this._listeners.filter(item => item.event === '*')

      let isPreventDefault = false
      let isStopPropagation = false
      let isStopImmediatePropagation = false

      const preventDefault = () => { isPreventDefault = true }
      const stopPropagation = () => { isStopPropagation = true }
      const stopImmediatePropagation = () => { isStopImmediatePropagation = true }

      const callback = (item) => {
        const e = {
          target: event,
          event: item.event,
          priority: item.priority,
          callback: item.callback,
          broadcast,
          preventDefault,
          stopPropagation,
          stopImmediatePropagation,
          stack: makeCodeStack(),
        }
        const fn = toAsync(item.callback)

        if (item.once) {
          this.off(item.event, item.callback)
        }

        return fn(e, ...args)
      }

      const trigger = () => new Promise((resolve, reject) => {
        let i = 0
        const len = events.length

        const through = () => {
          if (isPreventDefault) {
            resolve()
            return
          }

          if (isStopImmediatePropagation) {
            resolve()
            return
          }

          const item = events[i]
          if (i === len) {
            resolve()
            return
          }

          const defer = callback(item)
          i ++

          return defer.then(through).catch(reject)
        }
        through()
      })
      const propagate = () => new Promise((resolve, reject) => {
        let i = 0

        const items = [...children, ...parents]
        const len = items.length

        const through = () => {
          if (isStopPropagation) {
            resolve()
            return
          }

          if (isStopImmediatePropagation) {
            resolve()
            return
          }

          const item = items[i]
          if (i === len) {
            resolve()
            return
          }

          const defer = callback(item)
          i ++

          return defer.then(through).catch(reject)
        }
        through()
      })
      const touch = () => new Promise((resolve, reject) => {
        let i = 0
        const len = roots.length

        const through = () => {
          if (isStopImmediatePropagation) {
            resolve()
            return
          }

          const item = roots[i]
          if (i === len) {
            resolve()
            return
          }

          const defer = callback(item)
          i ++

          return defer.then(through).catch(reject)
        }
        through()
      })

      trigger().then(propagate).then(touch).then(resolve).catch(reject)
    })
  }

  // in parallel
  despatch(broadcast, event, ...args) {
    return new Promise((resolve, reject) => {
      if (this._isSilent) {
        return resolve()
      }

      if (typeof broadcast !== 'boolean') {
        args.unshift(event)
        event = broadcast
        broadcast = false
      }

      const events = this._listeners.filter(item => item.event === event)
      const isSecret = this._isSecret
      const parents = isSecret ? [] : this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
      const children = broadcast && !isSecret ? this._listeners.filter(item => item.event.indexOf(event + '.') === 0) : []
      const roots = isSecret ? [] : this._listeners.filter(item => item.event === '*')

      let isPreventDefault = false
      let isStopPropagation = false
      let isStopImmediatePropagation = false

      const preventDefault = () => { isPreventDefault = true }
      const stopPropagation = () => { isStopPropagation = true }
      const stopImmediatePropagation = () => { isStopImmediatePropagation = true }

      const callback = (item) => {
        const e = {
          target: event,
          event: item.event,
          priority: item.priority,
          callback: item.callback,
          broadcast,
          preventDefault,
          stopPropagation,
          stopImmediatePropagation,
          stack: makeCodeStack(),
        }
        const fn = toAsync(item.callback)

        if (item.once) {
          this.off(item.event, item.callback)
        }

        return fn(e, ...args)
      }

      const trigger = () => {
        const promises = []
        for (let i = 0, len = events.length; i < len; i ++) {
          if (isPreventDefault) {
            break
          }

          if (isStopImmediatePropagation) {
            break
          }

          const item = events[i]
          const defer = callback(item)
          promises.push(defer)
        }
        return Promise.all(promises)
      }
      const propagate = () => {
        const promises = []
        const relatives = [...children, ...parents]
        for (let i = 0, len = relatives.length; i < len; i ++) {
          if (isStopPropagation) {
            break
          }

          if (isStopImmediatePropagation) {
            break
          }

          const item = relatives[i]
          const defer = callback(item)
          promises.push(defer)
        }
        return Promise.all(promises)
      }
      const touch = () => {
        const promises = []
        for (let i = 0, len = roots.length; i < len; i ++) {
          if (isStopImmediatePropagation) {
            break
          }

          const item = roots[i]
          const defer = callback(item)
          promises.push(defer)
        }
        return Promise.all(promises)
      }

      trigger().then(propagate).then(touch).then(resolve).catch(reject)
    })
  }

  destroy() {
    // remove all events from global namespace
    // developers should must do this if they use namespace
    // or they will face memory stack overflow
    this._listeners.length = 0
  }
}

export default Etx

//// utils ////

function sort(items) {
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

function makeCodeStack() {
  const e = new Error()
  const stack = e.stack || e.stacktrace
  const stacks = stack.split('\n')
  stacks.shift()
  stacks.shift()
  const text = stacks.join('\n')
  return text
}

function toAsync(fn) {
  return  (...args) => {
    try {
      return Promise.resolve(fn(...args))
    }
    catch (e) {
      return Promise.reject(e)
    }
  }
}
