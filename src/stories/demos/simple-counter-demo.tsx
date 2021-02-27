import { attr, elem, h } from 'js-elements'
import { useState } from 'js-elements/hooks'

class CounterProps {
  @attr(Number)
  initialCount = 0

  @attr(String)
  label = 'Counter'
}

const Counter = elem('simple-counter', CounterProps, (p) => {
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

const CounterDemo = elem('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter />
    </div>
  )
})

export default CounterDemo
