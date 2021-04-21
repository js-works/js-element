import {
  attr,
  define,
  createEvent,
  createRef,
  event,
  impl,
  h,
  ref,
  Attr,
  Ref
} from 'js-element'

import { Listener, TypedEvent } from 'js-element'
import { useEffect, useEmitter, useMethods, useState } from 'js-element/hooks'

// new stuff
import { elem, prop } from 'js-element/core'

const buttonDemoStyles = ` 
  .demo-button {
    border: none;
    color: white;
    background-color: black;
    padding: 5px 8px;
    outline: none;
  }
  .demo-button:hover {
    background-color: #444;
  }
  .demo-button:active {
    background-color: #555;
  }
`

type ButtonClickEvent = TypedEvent<'button-click'>

class ButtonProps {
  @attr(Attr.string)
  text?: string

  onButtonClick?: Listener<ButtonClickEvent>
}

const DemoButton = define({
  tag: 'demo-button',
  props: ButtonProps,
  styles: buttonDemoStyles
}).bind((props) => {
  const emit = useEmitter()

  const onClick = () => {
    emit(createEvent('button-click'), props.onButtonClick)
  }

  return () => (
    <button class="demo-button" onclick={onClick}>
      {props.text}
    </button>
  )
})

const ButtonDemo = define('button-demo', () => {
  const onButtonClick = (ev: ButtonClickEvent) => alert(ev.type)
  const onCountChange = (ev: any) => console.log(ev)
  const counterRef = createRef()

  return () => (
    <div>
      <Counter ref={counterRef} onCountChange={onCountChange}></Counter>
      <button onclick={() => counterRef.current.reset()}>Reset</button>
      <h3>Button demo</h3>
      <DemoButton onButtonClick={onButtonClick} text="Click me" />
    </div>
  )
})

export default ButtonDemo

@elem('demo-counter')
class CounterScheme {
  @prop(Attr.string)
  initialCount = 32

  @prop(Attr.string)
  labelText = 'Counter'

  @event('count-change')
  onCountChange?: EventListener

  @ref()
  ref?: Ref<{
    reset(): void
  }>
}

const Counter = impl(CounterScheme, (p) => {
  const [s, set] = useState({ count: p.initialCount })
  const emit = useEmitter()
  const onClick = () => set('count', (it) => it + 1)

  useMethods(p.ref, {
    reset() {
      set('count', 0)
    }
  })

  useEffect(
    () => {
      emit(createEvent('count-change', { count: s.count }), p.onCountChange)
      console.log('changed', s.count)
    },

    () => [s.count]
  )

  return () => (
    <button onclick={onClick}>
      {p.labelText}: {s.count}
    </button>
  )
})
