# etx

A JS event schedule center.

## Install

```
npm i etx
```

## Import

ES6:

```js
import etx from 'etx'
```

CommonJS:

```js
const { etx } = require('etx')
```

AMD:

```html
<script src="./node_modules/etx/dist/etx.js"></script>
<script>
define(function(require, exports, module) {
  const { etx } = require('etx')
})
</script>
```

Normal Browsers:

```html
<script src="./node_modules/etx/dist/etx.js"></script>
<script>
const { etx } = window['etx']
</script>
```

## Usage

```js
const etx = new etx()
etx.on('my_event', (e, ...args) => {
  //...
})
//...
etx.emit('my_event', arg1, arg2)
```

## API

### on(event, callback, priority)

- event: string, event name
- callback: function, should be bound function if needed
- priority: number, the bigger the earlier, default 10

```js
etx.on('some_event', (e, name, age) => {
  if (name === 'dota') {
    e.stop()
  }
}, 13)

etx.emit('some_event', name, age)
```

Callback function parameters:

- e: a object which have some information about current event
  - origin: event name which passed by `emit`,
  - target: event name which passed by `on`,
  - priority: event priority,
  - callback: event callback,
  - callback_index: event callback index in callbacks,
  - callbacks_length: callbacks length,
  - stop: function, to stop run other event callbacks,
  - passed_args: args from prev callback,
  - stack: code stack, you can use it for debug,
- other parameters which passed by `emit`

**event name rules**

Use `.` to concat deep path.

```js
etx.on('root.child', fn) // the etx which have name begin with 'root.child' will be fired

etx.emit('root', data) // fn invoked
etx.emit('root.child.subchild', data) // fn not invoked

etx.on('*', fn) // will be fired when any emit occurs
```

### once(event, callback, priority)

The same as `on`, callback will only run once, after it is executed, it will be offed.

### off(event, callback)

If you do not pass callback, all callbacks of this event (containing sub-events) will be removed.

Notice: you should must off etx' callbacks when you do not need them!!!

### emit(event, ...args)

Trigger callback functions of this event by passing parameters.

### dispatch(event, ...args)

The same as `emit`. It is used to callback async functions and return a promise:

```js
etx.on('evt', async function f1() {})
etx.on('evt', async function f2() {})
etx.on('evt', async function f3() {})

await etx.dispatch('evt').then(() => { // f1, f2, f3 will run one by one (in series)
  // ...
})
```

For this code block, f2 will run after f1 resolved, f3 is the same will run after f2 resolved. If f1 rejected, f2 and f3 will not run any more.

Notice: callback function can be or not be async function.

### broadcast(event, ...args)

The same as `dispatch`. It is used to callback async functions and return a promise:

```js
etx.on('evt', async function f1() {})
etx.on('evt', async function f2() {})
etx.on('evt', async function f3() {})

await etx.broadcast('evt').then(() => { // f1, f2, f3 will run at the same time (in parallel)
  // ...
})
```

All the callback functions will be run at the same time.
Only after all callbacks resolved, the callback in then will run. If one of callbacks rejected, it not affect others, but the whole process will be rejected finally.
`.broadcast` will return a array which contains all results of callbacks.

Notice: callback function can be or not be async function.

### destroy()

Destory the instance.

## Passed Arguments

`.emit` and `.dispatch` will return the value of the last callback.
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
