import { define, h, MethodsOf, EventHandler, Ref, UIEvent } from 'js-elements'
import { createEvent, createRef } from 'js-elements/utils'

import {
  useEffect,
  useEmitter,
  useMethods,
  useState,
  useStatus
} from 'js-elements/hooks'

type CountChangeEvent = UIEvent<
  'count-change',
  {
    count: number
  }
>

class CounterP {
  initialCount = 0
  label = 'Counter'
  onCountChange?: EventHandler<CountChangeEvent>

  ref?: Ref<{
    reset(): void
    increment(): void
    decrement(): void
  }>
}

const Counter = define('complex-counter', CounterP, (p) => {
  const status = useStatus()
  const emit = useEmitter()

  const [s, set] = useState({
    count: p.initialCount
  })

  const onClick = () => set('count', (it) => it + 1)

  useMethods(p.ref, {
    reset: () => set('count', 0),
    increment: () => set('count', (it) => it + 1),
    decrement: () => set('count', (it) => it - 1)
  })

  useEffect(
    () => {
      if (status.hasUpdated()) {
        emit(createEvent('count-change', { count: s.count }), p.onCountChange)
      }
    },
    () => [s.count]
  )

  return () => (
    <button onClick={onClick}>
      {p.label}: {s.count}
    </button>
  )
})

export default define('complex-counter-demo', () => {
  const counterRef = createRef<MethodsOf<typeof Counter>>()
  const decrement = () => counterRef.current!.decrement()
  const increment = () => counterRef.current!.increment()
  const reset = () => counterRef.current!.reset()

  const onCountChange = (ev: CountChangeEvent) => {
    console.log('Count value has changed:', ev.detail.count)
  }

  return () => (
    <div>
      <h3>Complex counter demo</h3>
      <Counter ref={counterRef} onCountChange={onCountChange} />
      <div>
        <button onClick={reset}>Set to 0</button>
        <button onClick={decrement}>-1</button>
        <button onClick={increment}>+1</button>
      </div>
    </div>
  )
})
