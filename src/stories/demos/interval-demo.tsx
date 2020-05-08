/** @jsx h */
import { defineElement, h, toRef, useInterval, useState } from '../../main/index'

defineElement('interval-demo', (c: any) => { // TODO
  const
    [state, setState] = useState(c, {
      count: 0,
      delay: 1000
    }),

    onReset = () => setState('delay', 1000)

  useInterval(c, () => {
    setState('count', (it: any) => it + 1) // TODO
  }, toRef(() => state.delay))

  useInterval(c, () => {
    if (state.delay > 10) {
      setState('delay', (it: any) => it / 2) // TODO
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
