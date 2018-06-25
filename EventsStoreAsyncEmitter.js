const EventsStore = require('./EventsStore')

EventsStore.prototype.async = async function(event, ...args) {
  let items = this.events.filter(item => item.event === event)
  
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

  
  let i = 0
  let run = async (params) => {
    let item = items[i]
    if (!item) {
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
      stopImmediatePropagation: stop,
      preventDefault: stop,
      stopPropagation: stop,
      pass_args: params,
    }
    let result = await item.callback(e, ...args)

    i ++

    return await run(result)
  }

  return await run(args)
}

module.exports = EventsStore