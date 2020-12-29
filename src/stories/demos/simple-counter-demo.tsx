import { define, h, prop } from 'js-elements'
import { useState } from 'js-elements/hooks'

class CounterProps {
  @prop({ attr: Number })
  initialCount = 0

  @prop({ attr: String })
  label = 'Counter'
}

const Counter = define('simple-counter', CounterProps, (props) => {
  const [state, setState] = useState({
    count: props.initialCount
  })

  const onClick = () => setState('count', (it) => it + 1)

  return () => (
    <button onClick={onClick}>
      {props.label}: {state.count}
    </button>
  )
})

export default define('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter />
    </div>
  )
})
