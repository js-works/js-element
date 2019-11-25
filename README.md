# js-mojo

A R&D project to evaluate an alternative approach to define custom components.

Disclaimer:

Project is in a very, very early state ...
and btw: It will never be meant be used in production.

## Example

```js
import { component, prop, htm, useEffect, useOnMount, useOnRefresh, useState }
  from 'js-mojo'

const Counter = component('Counter', {
  properties: {
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

    useOnRefresh(c, () => {
      console.log('Component has been refreshed')
    })

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => htm`
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    `
  }
})

Counter.register('simple-counter') // register as custom element
```
