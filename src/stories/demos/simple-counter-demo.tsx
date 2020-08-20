import { component, h, prop } from '../../main/js-elements'

const SimpleCounter = component('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  main(c, props) {
    const [state, setState] = c.addState({ count: props.initialCount })
    const onIncrement = () => setState('count', (it) => it + 1)

    c.afterMount(() =>
      console.log('Component "simple-counter" has been mounted')
    )
    c.beforeUnmount(() =>
      console.log('Component "simple-counter" will be umounted')
    )

    c.effect(
      () => console.log(`Value of "${props.label}": ${state.count}`),
      () => [state.count]
    )

    return () => (
      <div>
        <label>{props.label}: </label>
        <button onClick={onIncrement}>{state.count}</button>
      </div>
    )
  }
})

component('simple-counter-demo', () => (
  <div>
    <h3>Counter demo</h3>
    <div>
      <SimpleCounter />
    </div>
  </div>
))
