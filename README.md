# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to be used in production.

## Example

### Stateless component

```js
import { component, h, prop, render } from 'js-elements'

const SayHello = component('say-hello', {
  props: {
    salutation: prop.str.opt('Hello')
    name: prop.str.opt('World')
  },

  render(props) {
    return <div>{props.salutation}, {props.name}!</div>
  }
})

render(<SayHello salutation="Hi" name="Jane Doe" />, '#app')
```

### Stateful component

```js
import { component, h, prop, render } from 'js-elements'
import counterStyles from './counter.css'

const Counter = component('demo-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  styles: simpleCounterStyles,

  main(c, props) {
    const [state, setState] = c.addState({ count: props.initialCount })
    const onIncrement = () => setState('count', it => it + 1)

    c.afterMount(() => console.log(`"${props.label}" has been mounted`)
    c.beforeUnmount(() => console.log(`Unmounting "${props.label}"`)

    c.effect(
      () => console.log(`Value of "${props.label}": ${count}`),
      () => [count]
    )

    return () => (
      <div class="counter">
        <label class="label">{props.label}: </label>
        <button class="button" onClick={onIncrement}>
          {count}
        </button>
      </div>
    )
  }
})

render(<Counter />, '#app')
```

_js-elements_ also supports so-called "extensions" which are
functions similar to React hooks (but without all the magic).
The naming pattern for these "extensions" is `$xyz`.

```jsx
import { component, h } from 'js-elements'
import { $time } from 'js-elements/ext'

const Clock = component('demo-clock', (c) => {
  const getTime = $time(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
```
