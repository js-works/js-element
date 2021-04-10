import { attr, define, h, Attr } from 'js-element'
import { useReactive, useState } from 'js-element/hooks'

class CounterProps {
  @attr(Attr.number, true)
  initialCount = 0

  @attr(Attr.string, true)
  label = 'Counter'
}

function Counter(p: { initialCount?: number; label?: string }) {
  const [s, set] = useState({ count: p.initialCount || 0 })
  const onClick = () => set('count', (it) => it + 1)

  return () => <button onclick={onClick}>Count: {s.count}</button>
}

function Test() {
  const s = useReactive({ count: 0 })
  const onClick = () => s.count++

  return () => <button onclick={onClick}>Count: {s.count}</button>
}

/*
const Counter = define({
  name: 'simple-counter',
  props: CounterProps
}).main((p) => {
  const s = useReactive({
    count: p.initialCount
  })

  const onClick = () => s.count++

  return () => (
    <button onclick={onClick}>
      {p.label}: {s.count}
    </button>
  )
})
*/

const CounterDemo = define('simple-counter-demo', () => {
  return () => (
    <div>
      <h3>Simple counter demo</h3>
      <Counter label="Counter" initialCount={100} />
      <Test />
    </div>
  )
})

export default CounterDemo
