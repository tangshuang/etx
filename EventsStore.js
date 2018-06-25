function EventsStore() {
  this.events = []
}

EventsStore.prototype.on = function(event, callback, priority = 10) {
  this.events.push({ event, callback, priority })
}

EventsStore.prototype.off = function(event, callback) {
  if (callback === undefined) {
    this.events = this.events.filter(item => item.event !== event)
  }
  else {
    this.events = this.events.filter(item => item.event !== event || (item.event === event && item.callback !== callback))
  }
}

EventsStore.prototype.emit = function(event, ...args) {
  let items = this.events.filter(item => item.event === event)
  
  // decs
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
      stopImmediatePropagation: stop,
      preventDefault: stop,
      stopPropagation: stop,
      pass_args: result,
    }
    result = item.callback(e, ...args)
  }

  return result
}

module.exports = EventsStore
