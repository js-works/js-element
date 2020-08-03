import { defineElement, html, prop } from '../../main/index'

defineElement('parent-component', (c) => {
  const onButtonClick = () => {
    setState({ count: state.count + 1 })
  }

  const [state, setState] = c.addState({
    count: 0
  })

  return () => html`
    <div>
      <button @click=${onButtonClick}>Update children</button>
      <hr />
      Last update parent component: ${new Date().toLocaleTimeString()}
      <div>
        <slot></slot>
      </div>
    </div>
  `
})

defineElement('child-component', {
  props: {
    count: prop.num.req()
  },

  render(props) {
    return html`
      <div>
        ${props.count} Last update child component:
        ${new Date().toLocaleTimeString()}
      </div>
    `
  }
})

defineElement('slots-demo', () => {
  return html`
    <div>
      <parent-component>
        <child-component .count=${10}></child-component>
      </parent-component>
    </div>
  `
})
