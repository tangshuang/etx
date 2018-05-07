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

    for (item of items) {
      if (item.callback(...args) === false) {
        break
      }
    }
  }
}