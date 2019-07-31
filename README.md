# etx

A JS event controller center.

## Install

```
npm i etx
```

## Import

ES6:

```js
import Etx from 'etx'
```

CommonJS:

```js
const { Etx } = require('etx')
```

AMD:

```html
<script src="./node_modules/etx/dist/etx.js"></script>
<script>
define(function(require, exports, module) {
  const { Etx } = require('etx')
})
</script>
```

Normal Browsers:

```html
<script src="./node_modules/etx/dist/etx.js"></script>
<script>
const { Etx } = window['etx']
</script>
```

## Usage

```js
const etx = new Etx()
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
  - target: event name which passed by `emit`,
  - event: event name which passed by `on`,
  - callback: event callback,
  - priority: event priority,
  - preventDefault: function, when invoked, the left callbacks of current event will not run
  - stopPropagation: fuction, when invoked, callbacks of children's and parents' will not run, not contains roots' callbacks
  - stopImmediatePropagation: function, preventDefault + stopPropagation, and roots' callbacks will not run
  - stack: code stack, you can use it for debug,
- ...args: which passed by `emit`

**event name rules**

Use `.` to concat deep path.

```js
etx.on('parent.child', fn)

etx.emit('parent', data) // fn not invoked
etx.emit('parent.child.subchild', data) // fn invoked
```

Use `*` to stand for root binding. All emits will trigger the callback of `*`, unless you call `stopImmediatePropagation` inside one of callbacks.

```js
etx.on('*', fn)
```

### off(event, callback)

If you do not pass callback, all callbacks of this event will be removed.

Notice: you should must off etx' callbacks when you do not need them!!!

### once(event, callback, priority)

The same as `on`, callback will only run once, after it is executed, it will be offed.

### emit(event, ...args)

Trigger callback functions of this event by passing arguments.
Will trigger parents' and roots' callbacks when propagete.

`args` will be received by `on` callback function.

### broadcast(event, ...args)

Like emit, and will trigger children's callbacks when propagate (before propagate to parents).

### dispatch(event, ...args)

Like `emit`, but use async callback functions and return a promise:

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

### despatch(event, ...args)

Like `broadcast` and `dispatch`.

```js
etx.on('evt', async function f1() {})
etx.on('evt', async function f2() {})
etx.on('evt', async function f3() {})

await etx.despatch('evt').then(() => { // f1, f2, f3 will run at the same time (in parallel)
  // ...
})
```

Each level (current, propagation, root) callbacks will run in parallel.
Only after all callbacks resolved, the callback in then will run.
If one of callbacks rejected, it not affect others, but the whole process will be rejected finally.

Notice: callback function can be or not be async function.

### destroy()

Destory the instance.
