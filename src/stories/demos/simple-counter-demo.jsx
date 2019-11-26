import { html, component, prop, useEffect, useState } from '../../main/index'

component('simple-counter-demo', {
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
      console.log('Component has been mounted')
      
      return () => console.log('Component will be umounted')
    }, null)

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => html`
      <div>
        <h3>Counter demo</h3>
        <label>${props.label}: </label>
        <button @click=${onIncrement}>${state.count}</button>
      </div>
    `
  }
})
