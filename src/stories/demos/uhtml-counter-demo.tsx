import { define, html } from 'js-element/uhtml'
import { useState } from 'js-element/hooks'

const UhtmlCounter = define('uhtml-counter', () => {
  const s = useState({ count: 0 })
  const onClick = () => s.count++

  return () => html`<button @click=${onClick}>Count: ${s.count}</button>`
})

const UhtmlCounterDemo = define('uhtml-counter-demo', () => {
  return () => html`
    <div>
      <h3>Uhtml counter demo</h3>
      <lit-counter />
    </div>
  `
})

export default UhtmlCounterDemo
