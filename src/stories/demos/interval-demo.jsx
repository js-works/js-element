/** @jsx h */
import { defineElement, h, toRef, useInterval, useState } from '../../main/index'

defineElement('interval-demo', c => {
  const
    [state, setState] = useState(c, {
      count: 0,
      delay: 1000
    }),

    onReset = () => setState('delay', 1000)

  useInterval(c, () => {
    setState('count', it => it + 1)
  }, toRef(() => state.delay))

  useInterval(c, () => {
    if (state.delay > 10) {
      setState('delay', it => it / 2)
    }
  }, 1000)

  return () =>
    <div>
      <h1>Counter: {state.count}</h1>
      <h4>Delay: {state.delay}</h4>
      <button onClick={onReset}>
        Reset delay
      </button>
    </div>
})
