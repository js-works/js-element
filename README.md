# js-element

A R&D project to evaluate an alternative approach to develop custom elements.

#### Disclaimer:

Project is in an early state ...
and it is currently not meant to ever be used in production.

## Example (simple counter)

```tsx
import { elem, method, prop, override, Attrs } from 'js-element'
import { html, lit } from 'js-element/lit'
import { useState } from 'js-element/hooks'
import counterStyles from './counter.css'

@elem({
  tag: 'x-counter',
  styles: counterStyles,
  impl: lit(counterImpl)
})
class Counter extends HTMLElement {
  @prop({ attr: Attrs.string, refl: true })
  labelText = 'Counter'

  @prop({ attr: Attrs.boolean, refl: true })
  disabled = false

  @method
  reset!: () => void
  
  @method
  increment!: (delta?: number) => void
}

function counterImpl(self: Counter) {
  const [state, setState] = useState({
    count: 0
  })

  const onClick = () => setState('count', (it) => it + 1)

  override(self, {
    reset() {
      setState('count', 0),
    },

    increment(delta = 1) {
      setState('count', (it) => it + delta),
    }
  })

  return () => html`
    <button ?disabled=${self.disabled} @click=${onClick}>
      ${self.labelText}: ${state.count}
    </button>
  `
}
```
