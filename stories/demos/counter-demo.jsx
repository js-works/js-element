import { h, component, prop, useEffect, useOnMount, useOnUpdate, useState } from '../../src/index'

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

    useOnUpdate(c, () => {
      console.log('Component has been updateed')
    })

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => (
      <div>
        <h3>Counter demo</h3>
        <label>{props.label}: </label>
        <button onClick={onIncrement}>{state.count}</button>
      </div>
    )
  }
})

CounterDemo.register('counter-demo')
