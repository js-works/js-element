import { attr, define, h, Attr } from 'js-element'
import { useDefaults, useReactive, useState } from 'js-element/hooks'

class CounterProps {
  @attr(Attr.number, true)
  initialCount = 0

  @attr(Attr.string, true)
  label = 'Counter'
}

function Counter(props: { initialCount?: number; label?: string }) {
  const p = useDefaults(props, {
    initialCount: 100,
    label: 'Counter'
  })

  const [s, set] = useState({ count: p.initialCount })
  const onClick = () => set('count', (it) => it + 1)

  return () => (
    <button onclick={onClick}>
      {p.label}: {s.count}
    </button>
  )
}

function Test() {
  const s = useReactive({ count: 0 })
  const onClick = () => s.count++

  return () => (
    <div style="border: 1px solid red; z-index: 100;">
      <slot>placeholder</slot>
    </div>
  )
}

/*
const Counter = define({
 tag: 'simple-counter',
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
      <Counter initialCount={33} />
      <Test>
        <div>xxx</div>
      </Test>
    </div>
  )
})

export default CounterDemo
