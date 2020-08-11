/** @jsx h */
import { component, h, prop } from '../../main/js-elements'

const SimpleCounterJsx = component('simple-counter-jsx', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  main(c, props) {
    let count = props.initialCount
    const onIncrement = c.updateFn(() => ++count)

    c.effect(() => {
      console.log('Component "simple-counter" has been mounted')

      return () => console.log('Component "simple-counter" will be umounted')
    }, null)

    c.effect(
      () => {
        console.log(`Value of "${props.label}": ${count}`)
      },
      () => [count]
    )

    return () => (
      <div>
        <label>{props.label}: </label>
        <button onClick={onIncrement}>{count}</button>
      </div>
    )
  }
})

component('simple-counter-jsx-demo', () => (
  <div>
    <h3>Counter demo</h3>
    <div>
      <SimpleCounterJsx />
    </div>
  </div>
))
