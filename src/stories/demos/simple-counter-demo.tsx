import { attr, define, h } from 'js-elements'
import { useState } from 'js-elements/hooks'

class CounterP {
  @attr(Number)
  initialCount = 0

  @attr(String)
  label = 'Counter'
}

const Counter = define('simple-counter', CounterP, (p) => {
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

export default define('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter />
    </div>
  )
})
