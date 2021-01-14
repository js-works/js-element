import { component, h, register } from 'js-elements'
import { useInterval, useState } from 'js-elements/hooks'

const IntervalDemo = component(() => {
  const [s, set] = useState({
    count: 0,
    delay: 1000
  })

  const onReset = () => set('delay', 1000)

  useInterval(
    () => set('count', (it) => it + 1),
    () => s.delay
  )

  useInterval(() => {
    if (s.delay > 10) {
      set('delay', (it) => it / 2)
    }
  }, 1000)

  return () => (
    <div>
      <h1>Counter: {s.count}</h1>
      <h4>Delay: {s.delay}</h4>
      <button onClick={onReset}>Reset delay</button>
    </div>
  )
})

register('interval-demo', IntervalDemo)

export default IntervalDemo
