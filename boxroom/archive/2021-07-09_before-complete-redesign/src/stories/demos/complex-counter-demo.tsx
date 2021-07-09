import {
  define,
  createEvent,
  createRef,
  h,
  Listener,
  MethodsOf,
  Ref,
  TypedEvent
} from 'js-element'

import {
  useEffect,
  useEmitter,
  useMethods,
  useState,
  useStatus
} from 'js-element/hooks'

type CountChangeEvent = TypedEvent<
  'count-change',
  {
    count: number
  }
>

class CounterProps {
  initialCount = 0
  label = 'Counter'
  onCountChange?: Listener<CountChangeEvent>

  ref?: Ref<{
    reset(): void
    increment(): void
    decrement(): void
  }>
}

const Counter = define('complex-counter', CounterProps, (p) => {
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
    <button onclick={onClick}>
      {p.label}: {s.count}
    </button>
  )
})

const CounterDemo = define('complex-counter-demo', () => {
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
        <button onclick={reset}>Set to 0</button>
        <button onclick={decrement}>-1</button>
        <button onclick={increment}>+1</button>
      </div>
    </div>
  )
})

export default CounterDemo
