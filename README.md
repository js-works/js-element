# js-elements

A R&D project to evaluate an alternative approach to define custom elements.

#### Disclaimer:

Project is in an early state ...
and btw: It is currently not meant to be used in production.

## Example

```js
import { component, html, prop, useEffect, useValue } from 'js-elements'
import simpleCounterStyles from './simple-counter.css'

// custom element will be registered as 'simple-counter' 

component('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  styles: simpleCounterStyles
}, props => {
  const 
    [count, setCount] = useValue(props.initialCount),
    onIncrement = () => setCount(it => it + 1)

  useEffect(() => {
    console.log(`"${props.label}" has been mounted`)

    return () => console.log(`Unmounting "${props.label}"`)
  }, null)

  useEffect(() => {
    console.log(`Value of "${props.label}": ${state.count}`)
  }, () => [count.value])

  return () => html`
    <div class="simple-counter"> 
      <label>${props.label}: </label>
      <button @click=${onIncrement}>${count.value}</button>
    </div>
  `
})
```
