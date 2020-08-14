# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to be used in production.

## Example

```js
import { h, prop, render, stateful } from 'js-elements'
import counterStyles from './counter.css'

const Counter = stateful('demo-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  styles: simpleCounterStyles,

  main(c, props) {
    let count = props.initialCount
    const onIncrement = c.updateFn(() => ++count)

    c.afterMount(() => {
      console.log(`"${props.label}" has been mounted`)
    })

    c.beforeUnmount(() => {
      console.log(`Unmounting "${props.label}"`)
    })

    c.effect(
      () => console.log(`Value of "${props.label}": ${count}`),
      () => [count]
    )

    return () => 
      <div class="simple-counter">
        <label class="simple-counter-label">{props.label}: </label>
        <button class="simple-counter-button" onClick={onIncrement}>
          {count}
        </button>
      </div>
  }
})

render(<Counter/>, '#app')
```

*js-elements* also supports so-called "extensions" which are
functions similar to React hooks (but without all the magic).
The naming pattern for these "extensions" is `withXyz`.

```jsx
const Clock = stateful('demo-clock', (c) => {
  const getTime = withTime(c, 1000, () => new Date().toLocaleTimeString()) 

  return () => <div>Current time: {getTime()}</div>
})
```