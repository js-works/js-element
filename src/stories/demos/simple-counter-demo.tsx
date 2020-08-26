import { component, h, prop } from 'js-elements'
import { useState } from 'js-elements/ext'

const SimpleCounter = component('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  }
})(function (c, props) {
  const [state, setState] = useState(c, {
    count: props.initialCount
  })

  const onIncrement = () => setState('count', (it) => it + 1)

  c.afterMount(() => console.log('Simple counter has been mounted'))
  c.beforeUnmount(() => console.log('Simple counter will be umounted'))

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
})

component('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Counter demo</h3>
      <div>
        <SimpleCounter />
      </div>
    </div>
  )
})
