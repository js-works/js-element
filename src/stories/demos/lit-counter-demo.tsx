import { define, html } from 'js-element/lit'
import { useMutable } from 'js-element/hooks'

const LitCounter = define('lit-counter', () => {
  const s = useMutable({ count: 0 })
  const onClick = () => s.count++

  return () => html`<button @click=${onClick}>Count: ${s.count}</button>`
})

const LitCounterDemo = define('lit-counter-demo', () => {
  return () => html`
    <div>
      <h3>Lit counter demo</h3>
      <lit-counter />
    </div>
  `
})

export default LitCounterDemo
