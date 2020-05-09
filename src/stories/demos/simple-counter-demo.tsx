import { defineElement, h, prop, useEffect, useState, Html, Component } from '../../main/index'

// needed for non-JSX example
const { div, h3 } = Html

type CounterProps = {
  initialCount?: number,
  label?: string
}

const Counter = defineElement<CounterProps>({
  name: 'simple-counter',

  props: {
    //initialCount: prop.num.opt(0),
    //label: prop.str.opt('Counter')
    
    initialCount: {
      defaultValue: 0
    },

    label: {
      defaultValue: 'Counter'
    }
  },

  init(c, props) {
    const
      [state, setState] = useState(c, { count: props.initialCount }),
      onIncrement = () => setState({ count: state.count + 1 })

    useEffect(c, () => {
      console.log('Component "simple-counter" has been mounted')
      
      return () => console.log('Component "simple-counter" will be umounted')
    }, null)
    
    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () =>
      <div>
        <label>{props.label}: </label>
        <button onClick={onIncrement}>
          {state.count}
        </button>
      </div>
  }
})

defineElement('simple-counter-demo', () => {
  return (
    div(
      h3('Counter demo'),
      div(Counter())
    )
  )
})
