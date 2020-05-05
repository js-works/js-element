/** @jsx h */
import { h, html, component, prop, useEffect, useState, Html } from '../../main/index'

// needed for non-JSX example
const { div, h3 } = Html

const Counter = component({
  name: 'simple-counter',

  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
}, (c, props) => {
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
})

const CounterDemo = component('simple-counter-demo', () => {

  return (
    div(
      h3('Counter demo'),
      div(Counter())
    )
  )
/*
  return (
    <div>
      <h3>Counter demo</h3>
      <div>
        <Counter/>
      </div>
    </div>
  )
*/
/*
  return () => html`
    <div>
      <h3>Counter demo</h3>
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    </div>
  `
*/
})
