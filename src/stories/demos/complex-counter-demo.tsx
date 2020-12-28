import { element, html, prop } from 'js-elements'
import { createEvent, createRef } from 'js-elements/utils'
import { EventHandler, MethodsOf, Ref, UIEvent } from 'js-elements/types'

import {
  useEffect,
  useEmitter,
  useMethods,
  useState,
  useStatus
} from 'js-elements/hooks'

type CountChangeEvent = UIEvent<
  'count-change',
  {
    count: number
  }
>

@element('complex-counter', {
  methods: ['reset', 'increment', 'decrement']
})
class ComplexCounter {
  @prop({ attr: Number })
  initialCount = 0

  @prop({ attr: String })
  label = 'Counter'

  @prop()
  ref?: Ref<{
    reset(): void
    increment(): void
    decrement(): void
  }>

  @prop()
  onCountChange?: EventHandler<CountChangeEvent>

  static main(self: ComplexCounter) {
    const status = useStatus()
    const emit = useEmitter()

    const [state, setState] = useState({
      count: self.initialCount
    })

    const onClick = () => setState('count', (it) => it + 1)

    useMethods(self.ref, {
      reset: () => setState('count', 0),
      increment: () => setState('count', (it) => it + 1),
      decrement: () => setState('count', (it) => it - 1)
    })

    useEffect(
      () => {
        if (status.hasUpdated()) {
          emit(
            createEvent('count-change', { count: state.count }),
            self.onCountChange
          )
        }
      },
      () => [state.count]
    )

    return () => html`
      <button onClick=${onClick}>${self.label}: ${state.count}</button>
    `
  }
}

@element('complex-counter-demo')
export default class ComplexCounterDemo {
  static main() {
    const counterRef = createRef<MethodsOf<ComplexCounter>>()
    const decrement = () => counterRef.current!.decrement()
    const increment = () => counterRef.current!.increment()
    const reset = () => counterRef.current!.reset()

    const onCountChange = (ev: CountChangeEvent) => {
      console.log('Count value has changed:', ev.detail.count)
    }

    return () => html`
      <div>
        <h3>Complex counter demo</h3>
        <complex-counter ref=${counterRef} onCountChange=${onCountChange} />
        <div>
          <button onClick=${reset}>Set to 0</button>
          <button onClick=${decrement}>-1</button>
          <button onClick=${increment}>+1</button>
        </div>
      </div>
    `
  }
}
