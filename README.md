# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to ever be used in production.

## Examples

### Example 1

```jsx
import { define, h, render } from 'js-elements'

class SayHelloProps {
  salutation = 'Hello'
  name = 'World'
}

const SayHello = define('say-hello', SayHelloProps, (props) => {
  return () => (
    <div>
      {props.salutation}, {props.name}!
    </div>
  )
})

render(<SayHello salutation="Hi" name="Jane Doe" />, '#app')
```

### Example 2

```jsx
import { define, h, render } from 'js-elements'
import { useEffect, useOnMount, useState, useStyles } from 'js-elements/hooks'
import counterStyles from './counter.css'

class CounterProps {
  initialCount = 0
  label = 'Counter'
}

const Counter = define('demo-counter', CounterProps, (props) => {
  const [state, setState] = useState({
    count: props.initialCount
  })

  const onClick = () => setState('count', (it) => it + 1)

  useStyles(counterStyles)

  useOnMount(() => {
    console.log(`"${props.label}" has been mounted`)

    return () => console.log(`Unmounting "${props.label}"`)
  })

  useEffect(
    () => console.log(`Value of "${props.label}": ${state.count}`),
    () => [state.count]
  )

  return () => (
    <div class="counter">
      <label class="label">{props.label}: </label>
      <button class="button" onClick={onClick}>
        {state.count}
      </button>
    </div>
  )
})

render(<Counter />, '#app')
```

### Example 3

```jsx
import { define, h, render } from 'js-elements'
import { useTime } from 'js-elements/hooks'

const DemoClock = define('demo-clock', () => {
  const getTime = useTime(1000, () => new Date().toLocaleTimeString())
  return () => <div>Current time: {getTime()}</div>
})

render(<DemoClock />, '#app')
```
