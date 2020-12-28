import { element, h } from 'js-elements'
import { useInterval, useState } from 'js-elements/hooks'

@element('interval-demo')
export default class IntervalDemo {
  static main() {
    const [state, setState] = useState({
      count: 0,
      delay: 1000
    })

    const onReset = () => setState('delay', 1000)

    useInterval(
      () => setState('count', (it) => it + 1),
      () => state.delay
    )

    useInterval(() => {
      if (state.delay > 10) {
        setState('delay', (it) => it / 2)
      }
    }, 1000)

    return () => (
      <div>
        <h1>Counter: {state.count}</h1>
        <h4>Delay: {state.delay}</h4>
        <button onClick={onReset}>Reset delay</button>
      </div>
    )
  }
}
