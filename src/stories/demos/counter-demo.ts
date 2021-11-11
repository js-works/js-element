import { component, elem, prop, setMethods, Attrs } from 'js-element'
import { useOnInit, useState } from 'js-element/hooks'
import { createRef, html, lit, ref } from 'js-element/lit'

@elem({
  tag: 'x-counter',
  // shadow: false, // TODO: Why exactly is this demo not working in light DOM?
  styles: () => styles,
  impl: lit(counterImpl)
})
class Counter extends component<{
  reset(): void
  increment(): void
  decrement(): void
}>() {
  @prop({ attr: Attrs.number, refl: true })
  initialCount = 0

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

  useOnInit(() => {
    setState('count', self.initialCount)
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
  impl: lit(counterDemoImpl)
})
class CounterDemo extends component() {}

function counterDemoImpl() {
  const counterRef = createRef<Counter>()

  const onResetClick = () => counterRef.value!.reset()
  const onDecrementClick = () => counterRef.value!.decrement()
  const onIncrementClick = () => counterRef.value!.increment()

  return () => html`
    <div>
      <h3>Counter demo</h3>
      <x-counter .initialCount=${100} ${ref(counterRef)}></x-counter>
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
