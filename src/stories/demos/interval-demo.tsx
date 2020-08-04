/** @jsx h */
import { defineElement, html } from '../../main/js-elements'
import { useInterval, useState } from '../../main/js-elements-ext'

defineElement('interval-demo', (c) => {
  const [state, setState] = useState(c, {
      count: 0,
      delay: 1000
    }),
    onReset = () => setState('delay', 1000)

  useInterval(
    c,
    () => {
      setState('count', (it: any) => it + 1) // TODO
    },
    () => state.delay
  )

  useInterval(
    c,
    () => {
      if (state.delay > 10) {
        setState('delay', (it: any) => it / 2) // TODO
      }
    },
    1000
  )

  return () => html`
    <div>
      <h1>Counter: ${state.count}</h1>
      <h4>Delay: ${state.delay}</h4>
      <button @click=${onReset}>Reset delay</button>
    </div>
  `
})
