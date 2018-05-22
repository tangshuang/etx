export default class Events {
  constructor() {
    this.events = []
  }
  on(event, callback, priority = 10) {
    this.events.push({ event, callback, priority })
  }
  off(event, callback) {
    if (callback === undefined) {
      this.events = this.events.filter(item => item.event === event)
    }
    else {
      this.events = this.events.filter(item => item.event === event && item.callback === callback)
    }
  }
  emit(event, ...args) {
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
    let stopImmediatePropagation = () => {
      isStoped = true
    }

    for (let item of items) {
      if (isStoped) {
        break
      }
      item.callback(...args, stopImmediatePropagation)
    }
  }
}
