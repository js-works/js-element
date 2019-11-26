import { html, component, prop, useEffect, useElementRef, useState } from '../../src/index'
import { directive, AttributePart } from 'lit-html'

component('complex-counter', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  methods: ['reset'],

  main(c, props, setMethods) {
    const 
      [state, setState] = useState(c, {
        count: props.initialValue
      }),

      onIncrement = () => setState('count', it => it + 1),
      onDecrement = () => setState('count', it => it - 1)

    setMethods({
      reset: (n = 0) => setState('count', n)
    })

    useEffect(c, () => {
      console.log('Component has been mounted mounted')
      
      return () => console.log('Component will be umounted')
    }, null)

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => html`
      <div>
        <label>${props.label}: </label>
        <button @click=${onDecrement}>-</button>
        <span>${state.count}</span>
        <button @click=${onIncrement}>+</button>
      </div>
    `
  }
})

component('complex-counter-demo', {
  main(c) {
    const
      counterRef = useElementRef(c),
      onSetTo0 = () => counterRef.current.reset(0),
      onSetTo100 = () => counterRef.current.reset(100)

    return () => html`
      <div>
        <h3>Complex counter demo</h3>
        <complex-counter *ref=${counterRef.bind}></complex-counter>
        <br/>
        <button @click=${onSetTo0}>Set to 0</button>
        <button @click=${onSetTo100}>Set to 100</button>
      </div>
    `
  }
})
