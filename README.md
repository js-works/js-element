# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to ever be used in production.

## Examples

### Stateless component (not a real API difference to stateful components - just a pattern)

```jsx
import { component, h, prop, render } from 'js-elements'

const SayHello = component('say-hello')({
  props: {
    salutation: prop.str.opt('Hello'),
    name: prop.str.opt('World')
  }
})((c, props) => {
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
import { useEffect, useState, useStyles } from 'js-elements/hooks'
import counterStyles from './counter.css'

const Counter = component('demo-counter')({
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
})((c, props) => {
  const [state, setState] = useState(c, {
    count: props.initialCount
  })

  const onClick = () => setState('count', it => it + 1)

  useStyles(c, counterStyles)
  
  useOnMount(c, () => {
    console.log(`"${props.label}" has been mounted`)
  
    return () => console.log(`Unmounting "${props.label}"`)
  })

  useEffect(c)(
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

_js-elements_ supports so-called "hooks" which are
functions similar to React hooks (but without all the magic).
All of those "hooks" can be written completely in userland
(means there are no such things like "core hooks").

```jsx
import { component, h } from 'js-elements'
import { useTime } from 'js-elements/hooks'

const Clock = component('demo-clock')((c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())
  return () => <div>Current time: {getTime()}</div>
})
```
