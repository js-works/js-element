import { attr, component, h, register } from 'js-elements'
import { useState } from 'js-elements/hooks'

class CounterProps {
  @attr(Number)
  initialCount = 0

  @attr(String)
  label = 'Counter'
}

const Counter = component(CounterProps, (p) => {
  const [s, set] = useState({
    count: p.initialCount
  })

  const onClick = () => set('count', (it) => it + 1)

  return () => (
    <button onClick={onClick}>
      {p.label}: {s.count}
    </button>
  )
})

const CounterDemo = component(() => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter />
    </div>
  )
})

register({
  'simple-counter': Counter,
  'simple-counter-demo': CounterDemo
})

export default CounterDemo
