import { element, h, component, prop } from 'js-elements'
import { useState } from 'js-elements/hooks'

@element('simple-counter')
class _SimpleCounter {
  @prop({ attr: Number })
  initialCount = 0

  @prop({ attr: String })
  label = 'Counter'

  static main(self: _SimpleCounter) {
    const [state, setState] = useState({
      count: self.initialCount
    })

    const onClick = () => setState('count', (it) => it + 1)

    return () => (
      <button onClick={onClick}>
        {self.label}: {state.count}
      </button>
    )
  }
}

const SimpleCounter = component(_SimpleCounter)

@element('simple-counter-demo')
export default class SimpleCounterDemo {
  static main() {
    return () => (
      <div>
        <h3>Simple counter demo</h3>
        <SimpleCounter />
      </div>
    )
  }
}
