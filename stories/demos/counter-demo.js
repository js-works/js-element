import { component, prop, htm, useEffect, useOnMount, useOnRefresh, useState } from '../../src/index'

const CounterDemo = component('CounterDemo', {
  properties: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  // eventNames: ['change']
  // methodNames: ['focus', 'reset']

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
      <h3>Counter demo</h3>
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    `
  }
})

CounterDemo.register('counter-demo')
