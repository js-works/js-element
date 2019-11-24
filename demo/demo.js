import { component, prop, htm, useOnMount, useOnRefresh, useState } from '../src/index.js'

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
      console.log('Mounted')
    })

    useOnRefresh(c, () => {
      console.log('Refreshed')
    })

    return () => htm`
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    `
  }
})

Counter.register('my-counter')
document.getElementById('app').innerHTML = '<my-counter a="B"/>'