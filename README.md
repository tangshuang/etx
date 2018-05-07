# Events.Class.js

A basic events manager.

## Usage

```
import Events from './Events.Class.js'

class MyClass extends Events {
  constructor() {
    this.fn = this.fn.bind(this)
  }
  bind() {
    this.on('my_event', this.fn)
  }
  remove() {
    this.off('my_event', this.fn)
  }
  trigger() {
    this.emit('my_event', 'david', 12)
  }
  fn(name, age) {
    console.log(name, age)
  }
}
```

## API

### on(event, callback, priority)

- event: string, event name
- callback: function, should be bound function if needed
- priority: number, the bigger the earlier, default 10

notice the return value of callback function, if you want to stop execute the next callback functions, you can return 'false':

```
.on('the_event', () => {
  if (this.name === 'dota') {
    // do something here
    return false // other callback functions after this in the event queue (priority < 13) will not execute any more
  }
  return true
}, 13)
```

### off(event, callback)

if you do not pass callback, all callbacks of this event will be removed

### emit(event, ...args)

trigger callback functions of this event by passing parameters.
