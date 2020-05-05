/** @jsx h */
import { h, html, component, prop, useEffect, useState } from '../../main/index'

component({
  name: 'simple-counter-demo',

  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
}, (c, props) => {
  const
    [state, setState] = useState(c, { count: props.initialCount }),
    onIncrement = () => setState({ count: state.count + 1 })

  useEffect(c, () => {
    console.log('Component "simple-counter-demo" has been mounted')
    
    return () => console.log('Component "simple-counter-demo" will be umounted')
  }, null)
  
  useEffect(c, () => {
    console.log(`New value of counter "${props.label}": ${state.count}`)
  }, () => [state.count])

  return () =>
    <div>
      <h3>Counter demo</h3>
      <label>{props.label}: </label>
      <button onClick={onIncrement}>
        {state.count}
      </button>
    </div>

  return () => html`
    <div>
      <h3>Counter demo</h3>
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    </div>
  `
})
