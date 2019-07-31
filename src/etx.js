export class Etx {
  constructor() {
    this._listeners = []
    this._isSilent = false
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

  hasRegistered(event) {
    if (Array.isArray(event)) {
      const events = event
      for (let i = 0, len = events.length; i < len; i ++) {
        const event = events[i]
        if (!this.hasRegistered(event)) {
          return false
        }
      }
      return true
    }

    const existing = this._listeners.find(item => item.event === event)
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

    const events = this._listeners.filter(item => item.event === event)
    const parents = this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
    const roots = this._listeners.filter(item => item.event === '*')

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

    for (let i = 0, len = parents.length; i < len; i ++) {
      if (isStopPropagation) {
        break
      }

      if (isStopImmediatePropagation) {
        break
      }

      const item = parents[i]
      callback(item)
    }

    for (let i = 0, len = roots.length; i < len; i ++) {
      if (isStopImmediatePropagation) {
        break
      }

      const item = roots[i]
      callback(item)
    }
  }

  broadcast(event, ...args) {
    if (this._isSilent) {
      return
    }

    const events = this._listeners.filter(item => item.event === event)
    const parents = this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
    const children = this._listeners.filter(item => item.event.indexOf(event + '.') === 0)
    const roots = this._listeners.filter(item => item.event === '*')

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

    for (let i = 0, len = roots.length; i < len; i ++) {
      if (isStopImmediatePropagation) {
        break
      }

      const item = roots[i]
      callback(item)
    }
  }

  // in series
  dispatch(event, ...args) {
    return new Promise((resolve, reject) => {
      if (this._isSilent) {
        return resolve()
      }

      const events = this._listeners.filter(item => item.event === event)
      const parents = this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
      const roots = this._listeners.filter(item => item.event === '*')

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

      const throughEvents = () => new Promise((resolve, reject) => {
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
      const throughParents = () => new Promise((resolve, reject) => {
        let i = 0
        const len = parents.length

        const through = () => {
          if (isStopPropagation) {
            resolve()
            return
          }

          if (isStopImmediatePropagation) {
            resolve()
            return
          }

          const item = parents[i]
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
      const throughRoots = () => new Promise((resolve, reject) => {
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

      throughEvents().then(throughParents).then(throughRoots).then(resolve).catch(reject)
    })
  }

  // in parallel
  despatch(event, ...args) {
    return new Promise((resolve, reject) => {
      if (this._isSilent) {
        return resolve()
      }

      const events = this._listeners.filter(item => item.event === event)
      const parents = this._listeners.filter(item => event.indexOf(item.event + '.') === 0)
      const roots = this._listeners.filter(item => item.event === '*')
      const children = this._listeners.filter(item => item.event.indexOf(event + '.') === 0)

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

      const broadcastEvents = () => {
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
      const broadcastPropagation = () => {
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
      const broadcastRoots = () => {
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

      broadcastEvents().then(broadcastPropagation).then(broadcastRoots).then(resolve).catch(reject)
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
