import { html, component, prop, useEffect, useElementRef, useMethods, useObservable } from '../../main/index'

component('complex-counter', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  methods: ['reset'],
}, props => {
  const 
    state = useObservable({
      count: props.initialValue
    }),

    onIncrement = () => { ++state.count },
    onDecrement = () => { --state.count }

  useMethods({
    reset(n) {
      state.count = n
    }
  })

  useEffect(() => {
    console.log('Component "complex-counter" has been mounted')
    
    return () => console.log('Component "complex-counter" will be umounted')
  }, null)

  useEffect(() => {
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
})

component('complex-counter-demo', () => {
  const
    counterRef = useElementRef(),
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
})
