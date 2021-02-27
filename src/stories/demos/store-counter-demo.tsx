import { define, h, MethodsOf, EventHandler, Ref, UIEvent } from 'js-elements'

import { initStore } from 'js-elements/utils'
import { createStoreHook } from 'js-elements/hooks'

function createCounterStore() {
  const [store, set] = initStore({
    count: 0,
    increment: () => set((state) => ({ ...state, count: state.count + 1 })),
    decrement: () => set((state) => ({ ...state, count: state.count - 1 }))
  })

  return store
}

const useCounterStore = createStoreHook(createCounterStore())

const Counter = define('store-counter', () => {
  const counter = useCounterStore()

  const onClick = () => counter.increment()

  return () => <button onClick={onClick}>Counter: {counter.count}</button>
})

const CounterDemo = define('store-counter-demo', () => {
  const counter = useCounterStore()
  const onIncrement = () => counter.increment()
  const onDecrement = () => counter.decrement()

  return () => (
    <div>
      <button onClick={onDecrement}>-</button>
      <Counter />
      <button onClick={onIncrement}>+</button>
    </div>
  )
})

export default CounterDemo
