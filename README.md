# HelloEvents

A JS events manager.

## Install

```
npm install --save hello-events
```

## Usage

```
import HelloEvents from 'hello-events'

class MyClass {
  constructor() {
    this.evtsman = new HelloEvents()
    this.fn = this.fn.bind(this)
  }
  bind() {
    this.evtsman.on('my_event', this.fn)
  }
  remove() {
    this.evtsman.off('my_event', this.fn)
  }
  trigger() {
    this.evtsman.emit('my_event', 'david', 12)
  }
  fn(e, name, age) {
    console.log(e, name, age)
  }
}
```

## Methods

### on(event, callback, priority)

- event: string, event name
- callback: function, should be bound function if needed
- priority: number, the bigger the earlier, default 10

```
eventsmanager.on('some_event', (e, name, age) => {
  if (name === 'dota') {
    e.stop()
  }
}, 13)
```

```
eventsmanager.emit('some_event', name, age)
```

Callback function parameters:

- e: a object which have some information about current event callback, use e.stop() to stop excuting the leftover callbacks.
- other parameters which passed by `emit`

### off(event, callback)

if you do not pass callback, all callbacks of this event will be removed.

### emit(event, ...args)

trigger callback functions of this event by passing parameters.


## Extends

### Async Emitter

```
import HelloEvents from 'hello-events/async'

const evtm = new HelloEvents()

evtm.on('sync', () => {})
evtm.on('async', async (e, name, age) => {})

evtm.on('sync')
evtm.async('async', 'tomy', 10).then(() => {}).catch(() => {})
```

This is used for async callback pipeline.
Here, you use `.async` instead of `.emit`, and ALL callbacks should be a async function.

### ES6 Class

```
import HelloEvents from 'hello-events/es6'

class MyClass extends HelloEvents {
  constructor(props) {
    super()
    this.props = props
    this.fn = this.fn.bind(this)
  }
  bind(event) {
    this.on(event, this.fn)
  }
  fn() {}
}
```

Here you can use `extends` keyword.

## Emit Result

The result of `.emit` or `.async` is the return value of last callback.
However, you can get the result of each callback during the pipeline by `e.pass_args`.

```
evt.on('data', (e, data) => {
  console.log(e.pass_args) // [0, 'a'] , which is emit passed arguments
  return { a: 'ok' }
})
evt.on('data', (e, data) => {
  console.log(e.pass_args) // { a: 'ok' }
  return 2
})
evt.emit('data', 0, 'a')
```