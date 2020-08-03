import { defineElement, html, prop } from '../../main/index'

defineElement('simple-counter', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  init(c, props) {
    const [state, setState] = c.addState({ count: props.initialCount }),
      onIncrement = () => {
        setState({ count: state.count + 1 })
      }

    c.effect(() => {
      console.log('Component "simple-counter" has been mounted')

      return () => console.log('Component "simple-counter" will be umounted')
    }, null)

    c.effect(
      () => {
        console.log(`New value of counter "${props.label}": ${state.count}`)
      },
      () => [state.count]
    )

    return () => {
      return html`
        <div>
          <label>${props.label}: </label>
          <button @click=${onIncrement}>
            ${state.count}
          </button>
        </div>
      `
    }
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
