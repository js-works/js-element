import { component, elem, prop, setMethods, Attrs } from 'js-element'
import { useState } from 'js-element/hooks'
import { createRef, html, ref, withLit } from 'js-element/lit'

@elem({
  tag: 'x-counter',
  styles: () => styles,
  impl: withLit(counterImpl)
})
class Counter extends component<{
  reset(): void
  increment(): void
  decrement(): void
}>() {
  @prop({ attr: Attrs.string, refl: true })
  labelText = 'Counter'

  @prop({ attr: Attrs.boolean, refl: true })
  disabled = false
}

function counterImpl(self: Counter) {
  const [state, setState] = useState({
    count: 0
  })

  const onClick = () => setState('count', (it) => it + 1)

  setMethods(self, {
    reset: () => setState('count', 0),
    increment: () => setState('count', (it) => it + 1),
    decrement: () => setState('count', (it) => it - 1)
  })

  return () => html`
    <button ?disabled=${self.disabled} @click=${onClick}>
      ${self.labelText}: ${state.count}
    </button>
  `
}

@elem({
  tag: 'x-counter-demo',
  styles: () => styles,
  impl: withLit(counterDemo)
})
class CounterDemo extends component() {}

function counterDemo() {
  const counterRef = createRef<Counter>()

  const onResetClick = () => counterRef.value!.reset()
  const onDecrementClick = () => counterRef.value!.decrement()
  const onIncrementClick = () => counterRef.value!.increment()

  return () => html`
    <div>
      <h3>Counter demo</h3>
      <x-counter ${ref(counterRef)}></x-counter>
      <button @click=${onDecrementClick}>-1</button>
      <button @click=${onIncrementClick}>+1</button>
      <button @click=${onResetClick}>Reset</button>
    </div>
  `
}

const styles = `
  * {
    font-family: Helvetica, Arial, sans-serif;
  }

  h3 {
    font-weight: 400;
  }

  button {
    border: none;
    color: white;
    background-color: rgb(0, 137, 223);
    cursor: pointer;
    padding: 6px 12px;
  }
`

export default CounterDemo
