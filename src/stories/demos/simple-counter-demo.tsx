import { h, prop, stateful, stateless } from '../../main/js-elements'

const SimpleCounter = stateful('simple-counter', {
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

stateless('simple-counter-demo', () => (
  <div>
    <h3>Counter demo</h3>
    <div>
      <SimpleCounter />
    </div>
  </div>
))
