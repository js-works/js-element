# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in a very, very early state ...
and btw: It will never be meant to be used in production.

## Example

```js
import { component, html, prop, useEffect, useState } from 'js-elements'

// custom element will automatically be registered as 'my-counter' 

component('my-counter', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  main(c, props) {
    const 
      [state, setState] = useState(c, {
        count: props.initialValue
      }),

      onIncrement = () => setState('count', it => it + 1)

    useEffect(c, () => {
      console.log(`"${props.label}" has been mounted`)

      return () => console.log(`Unmounting "${props.label}"`)
    }, null)

    useEffect(c, () => {
      console.log(`New value of "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => html`
      <div> 
        <label>${props.label}: </label>
        <button @click=${onIncrement}>${state.count}</button>
      </div>
    `
  }
})
```
