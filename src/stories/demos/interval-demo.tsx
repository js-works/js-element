import { h, stateful } from '../../main/js-elements'
import { $interval, $state } from '../../main/js-elements-ext'

stateful('interval-demo', (c) => {
  const [state, setState] = $state(c, {
      count: 0,
      delay: 1000
    }),
    onReset = () => setState('delay', 1000)

  $interval(
    c,
    () => {
      setState('count', (it: any) => it + 1) // TODO
    },
    () => state.delay
  )

  $interval(
    c,
    () => {
      if (state.delay > 10) {
        setState('delay', (it: any) => it / 2) // TODO
      }
    },
    1000
  )

  return () => (
    <div>
      <h1>Counter: {state.count}</h1>
      <h4>Delay: {state.delay}</h4>
      <button onClick={onReset}>Reset delay</button>
    </div>
  )
})
