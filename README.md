# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to be used in production.

## Example

```js
import { defineElement, html, prop } from 'js-elements'

import simpleCounterStyles from './simple-counter.css' // BEM conventions

defineElement('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  styles: [simpleCounterStyles],

  init(c, props) {
    const [state, setState] = c.addState({
      count: props.initialCount
    })

    const onIncrement = () => setState('count', (it) => it + 1)

    c.effect(() => {
      console.log(`"${props.label}" has been mounted`)

      return () => console.log(`Unmounting "${props.label}"`)
    }, null)

    c.effect(
      () => {
        console.log(`Value of "${props.label}": ${state.count}`)
      },
      () => [state.count]
    )

    return () => html`
      <div class="simple-counter">
        <label class="simple-counter__label">${props.label}: </label>
        <button class="simple-counter__button" @click=${onIncrement}>
          ${state.count}
        </button>
      </div>
    `
  }
})
```
