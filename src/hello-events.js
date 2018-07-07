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

export default class HelloEvents {
  constructor() {
    this.events = []
  }
  on(event, callback, priority = 10) {
    this.events.push({ event, callback, priority })
  }
  once(event, callback, priority = 10) {
    this.events.push({ event, callback, priority, once: 1 })
  }
  off(event, callback) {
    if (callback === undefined) {
      this.events = this.events.filter(item => item.event !== event)
    }
    else {
      this.events = this.events.filter(item => item.event !== event || (item.event === event && item.callback !== callback))
    }
  }
  trigger(event, ...args) {
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
        event_name: item.event,
        event_priority: item.priority,
        callback_index: i,
        callback_length: len,
        stop,
        pass_args: result,
      }
      result = item.callback(e, ...args)

      if (item.once) {
        this.off(item.event, item.callback)
      }
    }
  
    return result
  }
  async emit(event, ...args) {
    let items = this.events.filter(item => item.event === event)
    sortItemsByPriorityDESC(items)
  
    let isStoped = false
    let stop = () => {
      isStoped = true
      throw new Error()
    }

    let promises = []
    let result = { args }
    for (let i = 0, len = items.length; i < len; i ++) {
      if (isStoped) {
        break
      }
      
      let item = items[i]
      let e = {
        event_name: item.event,
        event_priority: item.priority,
        callback_index: i,
        callback_length: len,
        stop,
        pass_args: result.args,
      }
      let defer = item.callback(e, ...args).then((res) => {
        e.pass_args = res
        result.args = res
      })
      promises.push(defer)

      if (item.once) {
        this.off(item.event, item.callback)
      }
    }
  
    await Promise.all(promises)
    return result.args
  }
  async dispatch(event, ...args) {
    let items = this.events.filter(item => item.event === event)
    sortItemsByPriorityDESC(items)
  
    let i = 0
    let len = items.length
    let run = async (params) => {
      let item = items[i]
      if (i === len) {
        return params
      }
  
      let stop = () => {
        throw new Error()
      }
      let e = {
        event_name: item.event,
        event_priority: item.priority,
        callback_index: i,
        callback_length: len,
        stop,
        pass_args: params,
      }
      let result = await item.callback(e, ...args)

      if (item.once) {
        this.off(item.event, item.callback)
      }
  
      i ++
  
      return await run(result)
    }

    return await run(args)
  }
}