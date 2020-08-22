import { h, prop, stateful } from '../../main/js-elements'

type CounterMethods = {
  reset(n: number): void
}

const ComplexCounter = stateful('complex-counter', {
  props: {
    initialValue: prop.num.opt(0),
    label: prop.str.opt('Counter'),
    ref: prop.obj.opt()
  },

  methods: ['reset'],

  main(c, props) {
    const [state, setState] = c.addState({
      count: props.initialValue
    })

    const onIncrement = () => setState({ count: state.count + 1 })
    const onDecrement = () => setState({ count: state.count - 1 })

    c.setMethods({
      reset(n: number) {
        setState({ count: n })
      }
    })

    c.effect(() => {
      console.log('Component "complex-counter" has been mounted')

      return () => console.log('Component "complex-counter" will be umounted')
    }, null)

    c.effect(
      () => {
        console.log(`Value of counter "${props.label}": ${state.count}`)
      },
      () => [state.count]
    )

    return () => (
      <div>
        <label>{props.label}: </label>
        <button onClick={onDecrement}>-</button>
        <span> {state.count} </span>
        <button onClick={onIncrement}>+</button>
      </div>
    )
  }
})

stateful('complex-counter-demo', (c) => {
  const findCounter = () => c.find<CounterMethods>('[data-counter]')!
  const onSetTo0 = () => findCounter().reset(0)
  const onSetTo100 = () => findCounter().reset(100)

  return () => (
    <div>
      <h3>Complex counter demo</h3>
      <ComplexCounter data-counter></ComplexCounter>
      <br />
      <button onClick={onSetTo0}>Set to 0</button>
      <button onClick={onSetTo100}>Set to 100</button>
    </div>
  )
})
