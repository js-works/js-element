import { html, component, prop, useEffect, useState } from '../../main/index'

component('simple-counter-demo', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
}, props => {
  const
    [state, setState] = useState({ count: props.initialCount }),
    onIncrement = () => setState({ count: state.count + 1 })
  
  useEffect(() => {
    console.log('Component "simple-counter-demo" has been mounted')
    
    return () => console.log('Component "simple-counter-demo" will be umounted')
  }, null)
  
  useEffect(() => {
    console.log(`New value of counter "${props.label}": ${state.count}`)
  }, () => [state.count])

  return () => html`
    <div>
      <h3>Counter demo</h3>
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${state.count}</button>
    </div>
  `
})
