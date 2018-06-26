import EventsStoreBase from './EventsStoreAsyncEmitter'

export default class EventsStore {
  constructor() {
    EventsStoreBase.call(this)
  }
  on(...args) {
    EventsStoreBase.prototype.on.call(this, ...args)
  }
  off(...args) {
    EventsStoreBase.prototype.off.call(this, ...args)
  }
  emit(...args) {
    EventsStoreBase.prototype.emit.call(this, ...args)
  }
  async async(...args) {
    return await EventsStoreBase.prototype.async.call(this, ...args)
  }
}