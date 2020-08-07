/** @jsx h */
import { component, h, prop } from '../../main/js-elements'

component('simple-counter-jsx', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Counter')
  },

  main(c, props) {
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
    console.log('xxxx')
    return () =>
      h(
        'div',
        null,
        h('label', null, props.label),
        h('button', { onClick: onIncrement }, count)
      )
  }
})

component('simple-counter-jsx-demo', () =>
  h(
    'div',
    null,
    h('h3', null, 'Counter demo', h('div', null, h('simple-counter')))
  )
)
