import { createElement as h } from '../../main/libs/crank'
import { defineCrankElement, prop } from '../../main/js-elements-crank'

function* Counter(this: any, props: any) {
  // TODO
  let count = props.initialCount || 0

  const onIncrement = () => {
    ++count
    this.refresh()
  }

  for (props of this) {
    yield h(
      'button',
      { onclick: onIncrement },
      props.label || 'Count',
      ':',
      count
    )
  }
}

defineCrankElement('simple-counter-crank', {
  props: {
    initialCount: prop.num.opt(0),
    label: prop.str.opt('Count')
  },

  render({ initialCount, label }) {
    return h(Counter, { initialCount, label })
  }
})
