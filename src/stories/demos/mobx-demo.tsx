import { define, h } from 'js-element'
import { microstore } from 'js-element/utils'
import { makeAutoObservable } from 'mobx'

class CounterStore {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }
}

const fn = () => ({
  count: 0,

  increment() {
    this.count++
  },

  decrement() {
    this.count--
  }
})

const [useStoreProvider, useStore] = microstore<CounterStore>()

const MobxDemo = define('mobx-demo--parent', () => {
  const store = useStoreProvider(new CounterStore())

  return () => (
    <div>
      <div>Current count value: {store.count}</div>
      <CounterController />
    </div>
  )
})

const CounterController = define('mobx-demo-controller', () => {
  const store = useStore()
  const onIncClick = () => store.increment()
  const onDecClick = () => store.decrement()

  return () => (
    <div>
      <button onclick={onDecClick}>-1</button>
      {` ${store.count} `}
      <button onclick={onIncClick}>+1</button>
    </div>
  )
})

export default MobxDemo
