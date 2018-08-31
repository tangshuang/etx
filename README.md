# HelloEvents

A JS events manager.

## Install

```
npm install --save hello-events
```

## Usage

ES6: 

```
import HelloEvents from 'hello-events/src/hello-events'
```

With pack tools like webpack:

```
import HelloEvents from 'hello-events'
```

CommonJS:

```
const HelloEvents = require('hello-events')
```

AMD & CMD:

```
define(function(require, exports, module) {
  const HelloEvents = require('hello-events')
})
```

Normal Browsers:

```
<script src="./node_modules/hello-events/dist/hello-events.js"></script>
```

```
window.HelloEvents
```

To use:

```
const events = new HelloEvents()
events.on('my_event', (e, ...args) => {
  //...
})
//...
events.trigger('my_event', arg1, arg2)
```

## Methods

### on(event, callback, priority)

- event: string, event name
- callback: function, should be bound function if needed
- priority: number, the bigger the earlier, default 10

```
events.on('some_event', (e, name, age) => {
  if (name === 'dota') {
    e.stop()
  }
}, 13)
```

```
events.trigger('some_event', name, age)
```

Callback function parameters:

- e: a object which have some information about current event callback, use e.stop() to stop excuting the leftover callbacks.
- other parameters which passed by `trigger`

### once(event, callback, priority)

The same as `on`, callback will only run once, after it is executed, it will be offed.

### off(event, callback)

If you do not pass callback, all callbacks of this event will be removed.

### emit(event, ...args)

Trigger callback functions of this event by passing parameters.

### async dispatch(event, ...args)

The same as `trigger`. It is used to callback async functions at the same time:

```
events.on('evt', async function f1() {})
events.on('evt', async function f2() {})
events.on('evt', async function f3() {})
events.emit('evt').then(() => { // f1, f2, f3 will run at the same time
  // ...
})
```

All the callback functions will be run at the same time. Only after all callbacks resolved, the callback in then will run.

### async trigger(event, ...args)

The same as `trigger`. It is used to callback async functions one by one:

```
events.on('evt', async function f1() {})
events.on('evt', async function f2() {})
events.on('evt', async function f3() {})
events.dispatch('evt').then(() => {
  // ...
})
```

For this code block, f2 will run after f1 resolved, f3 is the same will run after f2 resolved. If f1 rejected, f2 and f3 will not run any more.

## Trigger Result

The result of `.emit` is the return value of last callback.
However, you can get the result of each callback during the pipeline by `e.pass_args`.

```
evt.on('data', (e, data) => {
  console.log(e.pass_args) // [0, 'a'] , which is trigger passed arguments
  return { a: 'ok' }
})
evt.on('data', (e, data) => {
  console.log(e.pass_args) // { a: 'ok' }
  return 2
})
let res = evt.trigger('data', 0, 'a') // res = 2
```
