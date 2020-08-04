import { defineElement, html, prop } from '../../main/js-elements'

defineElement('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  init(c, props) {
    let count = props.initialCount

    const onIncrement = c.updateFn(() => ++count)

    c.effect(() => {
      console.log('Component "simple-counter" has been mounted')

      return () => console.log('Component "simple-counter" will be umounted')
    }, null)

    c.effect(
      () => {
        console.log(`Value of "${props.label}": ${count}`)
      },
      () => [count]
    )

    return () => html`
      <div>
        <label>${props.label}: </label>
        <button @click=${onIncrement}>
          ${count}
        </button>
      </div>
    `
  }
})

defineElement(
  'simple-counter-demo',
  () => html`
    <div>
      <h3>Counter demo</h3>
      <div><simple-counter></simple-counter></div>
    </div>
  `
)
