import { html, component, toRef, useInterval, useState } from '../../main/index'

component('interval-demo', () => {
  const
    [state, setState] = useState({
      count: 0,
      delay: 1000
    }),

    onReset = () => setState('delay', 1000)

  useInterval(() => {
    setState('count', it => it + 1)
  }, toRef(() => state.delay))

  useInterval(() => {
    if (state.delay > 10) {
      setState('delay', it => it / 2)
    }
  }, 1000)

  return () => html`
    <div>
      <h1>Counter: ${state.count}</h1>
      <h4>Delay: ${state.delay}</h4>
      <button @click=${onReset}>
        Reset delay
      </button>
    </div>
  `
})
