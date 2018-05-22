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

Notice: the last parameter of callback function will always be `stopImmediatePropagation` which is used to stop execute following callback functions in event's queue.

```
.on('some_event', (name, age, stopImmediatePropagation) => {
  if (name === 'dota') {
    stopImmediatePropagation()
  }
}, 13)
```

```
.emit('some_event', name, age)
```

### off(event, callback)

if you do not pass callback, all callbacks of this event will be removed

### emit(event, ...args)

trigger callback functions of this event by passing parameters.
