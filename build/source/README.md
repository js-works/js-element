# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to be used in production.

## Example

```js
import { defineElement, h, prop, useEffect, useState } from 'js-elements'
import simpleCounterStyles from './simple-counter.css' // BEM conventions

// custom element will be registered as 'simple-counter' 

defineElement({
  name: 'simple-counter',

  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  styles: [simpleCounterStyles],

  init(c, props) {
    const 
      [state, setState] = useState(c, {
        count: props.initialCount
      }),

      onIncrement = () => setState('count', it => it + 1)

    useEffect(c, () => {
      console.log(`"${props.label}" has been mounted`)

      return () => console.log(`Unmounting "${props.label}"`)
    }, null)

    useEffect(c, () => {
      console.log(`Value of "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () =>
      <div class="simple-counter"> 
        <label class="simple-counter__label">{props.label}: </label>
        <button class="simple-counter__button" onClick={onIncrement}>{state.count}</button>
      </div>
  }
})
```
