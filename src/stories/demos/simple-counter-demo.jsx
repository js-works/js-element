import { html, component, prop, useEffect, useValue } from '../../main/index'

component('simple-counter-demo', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
}, props => {
  const
    [count, setCount] = useValue(props.initialValue),
    onIncrement = () => setCount(it => it + 1)

  useEffect(() => {
    console.log('Component "simple-counter-demo" has been mounted')
    
    return () => console.log('Component "simple-counter-demo" will be umounted')
  }, null)
  
  useEffect(() => {
    console.log(`New value of counter "${props.label}": ${count.value}`)
  }, () => [count.value])

  return () => html`
    <div>
      <h3>Counter demo</h3>
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${count.value}</button>
    </div>
  `
})
