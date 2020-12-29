import { define, h, prop } from 'js-elements'
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

class CounterProps {
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
}

const Counter = define('complex-counter', CounterProps, (props) => {
  const status = useStatus()
  const emit = useEmitter()

  const [state, setState] = useState({
    count: props.initialCount
  })

  const onClick = () => setState('count', (it) => it + 1)

  useMethods(props.ref, {
    reset: () => setState('count', 0),
    increment: () => setState('count', (it) => it + 1),
    decrement: () => setState('count', (it) => it - 1)
  })

  useEffect(
    () => {
      if (status.hasUpdated()) {
        emit(
          createEvent('count-change', { count: state.count }),
          props.onCountChange
        )
      }
    },
    () => [state.count]
  )

  return () => (
    <button onClick={onClick}>
      {props.label}: {state.count}
    </button>
  )
})

export default define('complex-counter-demo', () => {
  const counterRef = createRef<MethodsOf<typeof Counter>>()
  const decrement = () => counterRef.current!.decrement()
  const increment = () => counterRef.current!.increment()
  const reset = () => counterRef.current!.reset()

  const onCountChange = (ev: CountChangeEvent) => {
    console.log('Count value has changed:', ev.detail.count)
  }

  return () => (
    <div>
      <h3>Complex counter demo</h3>
      <Counter ref={counterRef} onCountChange={onCountChange} />
      <div>
        <button onClick={reset}>Set to 0</button>
        <button onClick={decrement}>-1</button>
        <button onClick={increment}>+1</button>
      </div>
    </div>
  )
})
