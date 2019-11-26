# js-mojo

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in a very, very early state ...
and btw: It will never be meant to be used in production.

## Example

```js
import { component, html, prop, useEffect, useOnMount, useOnUpdate, useState } from 'js-mojo'

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

    useOnMount(c, () => {
      console.log('Component has been mounted mounted')
    })

    useOnUpdate(c, () => {
      console.log('Component has been updated')
    })

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => html`
      <div> 
        <label>${props.label}: </label>
        <button onclick=${onIncrement}>${state.count}</button>
      </div>
    `
  }
})
```
