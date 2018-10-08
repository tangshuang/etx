# HelloEvents

A JS events manager.

## Install

```
npm install --save hello-events
```

## Usage

ES6:

```js
import HelloEvents from 'hello-events/src/hello-events'
```

With pack tools like webpack:

```js
import HelloEvents from 'hello-events'
```

CommonJS:

```js
const HelloEvents = require('hello-events')
```

AMD & CMD:

```js
define(function(require, exports, module) {
  const HelloEvents = require('hello-events')
})
```

Normal Browsers:

```html
<script src="./node_modules/hello-events/dist/hello-events.js"></script>
<script>
const HelloEvents = window.HelloEvents
</script>
```

To use:

```js
const events = new HelloEvents()
events.on('my_event', (e, ...args) => {
  //...
})
//...
events.emit('my_event', arg1, arg2)
```

## Methods

### on(event, callback, priority)

- event: string, event name
- callback: function, should be bound function if needed
- priority: number, the bigger the earlier, default 10

```js
events.on('some_event', (e, name, age) => {
  if (name === 'dota') {
    e.stop()
  }
}, 13)

events.trigger('some_event', name, age)
```

Callback function parameters:

- e: a object which have some information about current event callback, use e.stop() to stop excuting the leftover callbacks.
- other parameters which passed by `trigger`

### once(event, callback, priority)

The same as `on`, callback will only run once, after it is executed, it will be offed.

### off(event, callback)

If you do not pass callback, all callbacks of this event will be removed.

Notice: you should must off events' callbacks when you do not need it!!!

### emit(event, ...args)

Trigger callback functions of this event by passing parameters.

### dispatch(event, ...args)

The same as `emit`. It is used to callback async functions and return a promise:

```js
events.on('evt', async function f1() {})
events.on('evt', async function f2() {})
events.on('evt', async function f3() {})

await events.dispatch('evt').then(() => { // f1, f2, f3 will run one by one
  // ...
})
```

For this code block, f2 will run after f1 resolved, f3 is the same will run after f2 resolved. If f1 rejected, f2 and f3 will not run any more.

### confluer(event, ...args)

The same as `dispatch`. It is used to callback async functions and return a promise:

```js
events.on('evt', async function f1() {})
events.on('evt', async function f2() {})
events.on('evt', async function f3() {})

await events.confluer('evt').then(() => { // f1, f2, f3 will run at the same time
  // ...
})
```

All the callback functions will be run at the same time. Only after all callbacks resolved, the callback in then will run.

## Passed Arguments

`.confluer` will return a array which contains all results of callbacks.

`.emit` and `.dispatch` will return the value of last callback.
However, you can get the result of each callback during the pipeline by `e.passed_args`.

```js
evt.on('data', (e, data) => {
  console.log(e.passed_args)  // [0, 'a']      <-------------------------+
  return { a: 'ok' }          // ---------------------+                  |
})                            //                      |                  |
evt.on('data', (e, data) => { //                      |                  |
  console.log(e.passed_args)  // { a: 'ok' }    <-----+                  |
  return 2                    // -----------------------+                |
})                            //                        |                |
let res = await evt.dispatch('data', 0, 'a')  // -------+----------------+
console.log(res)              // 2    <-----------------+
```
