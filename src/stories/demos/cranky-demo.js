/** @jsx h */
import { component, h, prop, provision, render } from './crank-webcomponents'

// This should normally be in an extra file and be included
// (with automatic minification) by a webpack/rollup/whatever
// loader
const cardStyles = `
  :host {
    font-family: Arial,Helvetica,sans-serif;
    font-size: 14px;
  }

  .card {
    margin: 0;
    padding: 0;
    border: 1px solid #bbb;
    background-color: #ccc;
  }

  .card-header {
    margin: 0;
    padding: 4px 8px;
    font-weight: bold;
  }
  
  .card-content {
    margin: 0;
    padding: 12px 16px;
    background-color: #f7f7f7;
  }
`

// counterpart to React context API
const [provideTheme, consumeTheme] = provision('theme', 'auto')

const Card = component('demo-card', {
  props: {
    headline: prop.str.req()
  },

  slots: ['default'], // this is just for information
  styles: cardStyles,

  main(props) {
    console.log('main')
    return h(
      'div',
      { class: 'card' },
      h('div', { class: 'info-box-header' }, props.headline),
      h('div', { class: 'card-content' }, h('slot'))
    )
  }
})

const Counter = component('demo-counter', {
  props: {
    label: prop.str.opt('Counter'),
    initialCount: prop.num.opt(0)
  },

  *main(props) {
    console.log('main generator')
    let count = props.initialCount

    const onIncrement = () => {
      ++count
      this.refresh()
    }

    const onDecrement = () => {
      --count
      this.refresh()
    }
    console.log(0)
    for (props of this) {
      console.log(1111, props)
      yield h(
        'div',
        h(
          'label',
          props.label,
          ': ',
          h('button', { onclick: onDecrement }, '-')
        ),
        h('span', ' ', count),
        h('button', { onclick: onDecrement }, '+')
      )
    }
  }
})

const CrankyDemo = component('cranky-demo', function* () {
  provideTheme(this, 'light')
  console.log('generator 2')
  while (true) {
    yield h(Card, { headline: 'Counter demo' }, h(Counter))
  }
})
