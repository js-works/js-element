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
import { useState } from 'js-element/hooks'

const Counter = define('demo-counter', () => {
  const [state, setState] = useState({ count: 0 })
  const onClick = () => setState('count', it => it + 1)

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
import { useState } from 'js-element/hooks'

define('demo-counter', () => {
  const [state, setState] = useState({ count: 0 })
  const onClick = () => setState('count', it => it + 1) 

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
import { useState } from 'js-element/hooks'

define('demo-counter', () => {
  const [state, setState] = useState({ count: 0 })
  const onClick = () => setState('count', it => it + 1)

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
// the author's preferred syntax and naming convention -
// may look a bit odd first, but you'll get used to it ;-)

import { attr, define, h, render, Attr } from 'js-element'
import { useEffect, useAfterMount, useState } from 'js-element/hooks'
import counterStyles from './counter.scss'

class CounterProps {
  @attr(Attr.number, true) // true as 2nd argument means: reflect attribute
  initialCount = 0

  @attr(Attr.string, true)
  label = 'Counter'
}

const Counter = define({
  tag: 'demo-counter',
  props: CounterProps,
  styles: counterStyles
}).bind((p) => {
  const [state, setState] = useState({
    count: p.initialCount
  })

  const onClick = () => setState('count', it => it + 1)

  useAfterMount(() => {
    console.log(`"${p.label}" has been mounted`)

    return () => console.log(`Unmounting "${p.label}"`)
  })

  useEffect(
    () => console.log(`Value of "${p.label}": ${s.count}`),
    () => [s.count]
  )

  return () => (
    <div class="counter">
      <label class="label">{p.label}: </label>
      <button class="button" onclick={onClick}>
        {s.count}
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

render(<Clock />, '#app')
```

### Example 7 (using context)

```jsx
import { createCtx, define, defineProvider, h, render } from 'js-element'
import { useCtx, useInterval, useState } from 'js-element/hooks'

const ThemeCtx = createCtx('light')
const ThemeProvider = defineProvider('theme-provider', ThemeCtx)

const ContextDemo = define('context-demo', () => {
  const [state, setState] = useState({ theme: 'light' })

  useInterval(() => {
    setState('theme', state.theme === 'light' ? 'dark' : 'light')
  }, 1000)

  return () => (
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <ThemeProvider value={state.theme}>
        <ThemeInfo />
      </ThemeProvider>
    </div>
  )
})

const ThemeInfo = define('theme-info', () => {
  const ctx = useCtx({ theme: ThemeCtx })
  return () => <div>Current theme: {ctx.theme}</div>
})

render(<ContextDemo/>, '#app')
```