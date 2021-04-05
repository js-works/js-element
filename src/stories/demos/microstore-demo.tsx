import { define, h } from 'js-element'
import { microstore } from 'js-element/utils'

const [useStoreProvider, useStore] = microstore(() => ({
  count: 0,

  increment() {
    this.count++
  },

  decrement() {
    this.count--
  }
}))

const MicrostoreDemo = define('microstore-demo--parent', () => {
  const store = useStoreProvider()

  return () => (
    <div>
      <div>Current count value: {store.count}</div>
      <CounterController />
    </div>
  )
})

const CounterController = define('microstore-demo-controller', () => {
  const store = useStore()
  const onIncClick = () => store.increment()
  const onDecClick = () => store.decrement()
  console.log(222)

  return () => (
    <div>
      <button onclick={onDecClick}>-1</button>
      {` ${store.count} `}
      <button onclick={onIncClick}>+1</button>
    </div>
  )
})

export default MicrostoreDemo
