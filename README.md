# js-element

A R&D project to evaluate an alternative approach to develop custom elements.
The package `js-element` uses a patched version of [superfine](https://github.com/jorgebucaran/superfine), a very lightweight virtual DOM library.
The subpackages `js-element/lit` and `js-element/uhtml` use [lit-html](https://lit-html.polymer-project.org/) respective [uhtml](https://github.com/WebReflection/uhtml) instead.

#### Disclaimer:

Project is in an early state ...
and it is currently not meant to ever be used in production.

## Examples

### Example 1 (using JSX)

```jsx
import { define, h, render } from 'js-element'
import { useMutable } from 'js-element/hooks'

const Counter = define('demo-counter', () => {
  const state = useMutable({ count: 0 })
  const onClick = () => state.count++

  return () => ( 
    <button onclick={onClick}>
      Count: {state.count}
    </button>
  )
})

render(<Counter />, '#app')
```

### Example 2 (using lit-html)

```js
import { define, html, render } from 'js-element/lit'
import { useMutable } from 'js-element/hooks'

define('demo-counter', () => {
  const state = useMutable({ count: 0 })
  const onClick = () => state.count++

  return () => html`
    <button @click=${onClick}>
      Count: ${state.count}
    </button>
  `
})

render(html`<demo-counter></demo-counter>`, '#app')
```

### Example 3 (using uhtml)

```js
import { define, html, render } from 'js-element/uhtml'
import { useMutable } from 'js-element/hooks'

define('demo-counter', () => {
  const state = useMutable({ count: 0 })
  const onClick = () => state.count++

  return () => html`
    <button @click=${onClick}>
      Count: ${state.count}
    </button>
  `
})

render(html`<demo-counter />`, '#app')
```

### Example 4

```jsx
import { define, h, render } from 'js-element'

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

### Example 5

```jsx
import { attr, define, h, render, Attr } from 'js-element'
import { useEffect, useOnMount, useState, useStyles } from 'js-element/hooks'
import counterStyles from './counter.css'

class CounterProps {
  @attr(Attr.number, true) // true as 2nd argument means: reflect attribute
  initialCount = 0

  @attr(Attr.string, true)
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
      <button class="button" onclick={onClick}>
        {state.count}
      </button>
    </div>
  )
})

render(<Counter />, '#app')
```

### Example 6

```jsx
import { define, h, render } from 'js-element'
import { useTimer } from 'js-element/hooks'

const Clock = define('demo-clock', () => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())
  return () => <div>Current time: {getTime()}</div>
})

render(<DemoClock />, '#app')
```
