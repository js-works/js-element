# js-elements

A R&D project to evaluate an alternative approach to component custom elements.

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
import { attr, define, h, render } from 'js-elements'
import { useEffect, useOnMount, useState, useStyles } from 'js-elements/hooks'
import counterStyles from './counter.css'

class CounterProps {
  @attr(Number)
  initialCount = 0

  @attr(String)
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
import { useTimer } from 'js-elements/hooks'

const Clock = define('demo-clock', () => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())
  return () => <div>Current time: {getTime()}</div>
})

render(<DemoClock />, '#app')
```
