import { define, h, MethodsOf, EventHandler, Ref, UIEvent } from 'js-element'

import { initStore } from 'js-element/utils'
import { createStoreHook } from 'js-element/hooks'

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

  const onclick = () => counter.increment()

  return () => <button onclick={onclick}>Counter: {counter.count}</button>
})

const CounterDemo = define('store-counter-demo', () => {
  const counter = useCounterStore()
  const onIncrement = () => counter.increment()
  const onDecrement = () => counter.decrement()

  return () => (
    <div>
      <button onclick={onDecrement}>-</button>
      <Counter />
      <button onclick={onIncrement}>+</button>
    </div>
  )
})

export default CounterDemo
