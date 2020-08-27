# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to ever be used in production.

## Examples

### Stateless component (not a real API difference to stateful components - just a pattern)

```jsx
import { component, h, prop, render } from 'js-elements'

const SayHello = component('say-hello', {
  props: {
    salutation: prop.str.opt('Hello')
    name: prop.str.opt('World')
  }
}, (c, props) => {
  return () => (
    <div>
      {props.salutation}, {props.name}!
    </div>
  )
})

render(<SayHello salutation="Hi" name="Jane Doe" />, '#app')
```

### Stateful component

```jsx
import { component, h, prop, render } from 'js-elements'
import counterStyles from './counter.css'

const Counter = component('demo-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
}, (c, props) => {
  let count = 0
  
  const onClick = () => {
    ++count
    c.refresh()
  }

  c.addStyles(counterStyles)
  c.afterMount(() => console.log(`"${props.label}" has been mounted`))
  c.beforeUnmount(() => console.log(`Unmounting "${props.label}"`))

  c.effect(
    () => console.log(`Value of "${props.label}": ${count}`),
    () => [count]
  )

  return () => (
    <div class="counter">
      <label class="label">{props.label}: </label>
      <button class="button" onClick={onClick}>
        {count}
      </button>
    </div>
  )
})

render(<Counter />, '#app')
```

Unfortunatlely, if you are using the prettier code formatter, the
above shown syntax will be reformatted in a way that you may not
necessarily want.
Therefore the following more prettier friendly alternative syntax
is also allowed:

```jsx
import { component, h, prop } from 'js-elements'

export default component('demo-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
})(function (c, props) {
  let count = 0
  
  const onClick = () => {
    ++count
    c.refresh()
  }

  return () => (
    <div>
      <label>{props.label}: </label>
      <button onClick={onClick}>
        {count}
      </button>
    </div>
  )
})
```


_js-elements_ also supports so-called "extensions" which are
functions similar to React hooks (but without all the magic).
All of those "extensions" can be written completely in userland
(means there are no such things like "core extensions").

```jsx
import { component, h } from 'js-elements'
import { useTime } from 'js-elements/ext'

const Clock = component('demo-clock', (c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())
  return () => <div>Current time: {getTime()}</div>
})
```
