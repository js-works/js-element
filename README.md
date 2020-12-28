# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to ever be used in production.

## Examples

### Example 1

```jsx
import { element, h, prop, render } from 'js-elements'

@element('say-hello')
class SayHello {
  @prop()
  salutation = 'Hello'

  @prop()
  name = 'World'

  static main(self) {
    return () => (
      <div>
        {self.salutation}, {self.name}!
      </div>
    )
  }
}

render(<SayHello salutation="Hi" name="Jane Doe" />, '#app')
```

### Example 2

```jsx
import { element, h, prop, render } from 'js-elements'
import { useEffect, useOnMount, useState, useStyles } from 'js-elements/hooks'
import counterStyles from './counter.css'

@element('demo-counter')
class Counter {
  @prop()
  initialCount = 0

  @prop()
  label = 'Counter'

  static main(self) {
    const [state, setState] = useState({
      count: props.initialCount
    })

    const onClick = () => setState('count', (it) => it + 1)

    useStyles(counterStyles)

    useOnMount(() => {
      console.log(`"${self.label}" has been mounted`)

      return () => console.log(`Unmounting "${self.label}"`)
    })

    useEffect(
      () => console.log(`Value of "${self.label}": ${state.count}`),
      () => [state.count]
    )

    return () => (
      <div class="counter">
        <label class="label">{self.label}: </label>
        <button class="button" onClick={onClick}>
          {state.count}
        </button>
      </div>
    )
  }
}

render(<Counter />, '#app')
```

### Example 3

```jsx
import { element, h, render } from 'js-elements'
import { useTime } from 'js-elements/hooks'

@element('demo-clock')
class DemoClock {
  static main() {
    const getTime = useTime(1000, () => new Date().toLocaleTimeString())
    return () => <div>Current time: {getTime()}</div>
  }
}

render(<DemoClock />, '#app')
```
