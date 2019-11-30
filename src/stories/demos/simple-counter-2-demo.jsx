import { html, component, prop, useEffect } from '../../main/index'
import componentActions from './tools/componentActions'

const useActions = componentActions(update => ({
  increment(state) {
    update({ count: state.count + 1 })
  },

  decrement(state) {
    update({ count: state.count - 1 })
  }
}), initialValue => ({ count: initialValue }))

component('simple-counter-2-demo', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  main(c, props) {
    const
      [actions, state] = useActions(c, props.initialValue),
      onIncrement = () => actions.increment(),
      onDecrement = () => actions.decrement()

    useEffect(c, () => {
      console.log('Component has been mounted')
      
      return () => console.log('Component will be umounted')
    }, null)
    
    useEffect(c, () => {
      if (c.isMounted()) {
        console.log('Component has been updated')
      }
    })

    useEffect(c, () => {
      console.log(`New value of counter "${props.label}": ${state.count}`)
    }, () => [state.count])

    return () => html`
      <div>
        <h3>Counter demo</h3>
        <label>${props.label}: </label>
        <button @click=${onDecrement}>-</button>
        ${state.count}
        <button @click=${onIncrement}>+</button>
      </div>
    `
  }
})
