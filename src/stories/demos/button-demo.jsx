import { html, component, prop } from '../../main/index'

component('demo-button', {
  props: {
    text: prop.str.opt(''),
    onAction: prop.func.opt()
  }
}, props => {
  const onClick = () => {
    props.onAction && props.onAction(new CustomEvent('action'))
  }

  return html`
    <button @click=${onClick}>${props.text}</button>
  `
})

component('button-demo', () => {
  const onAction = e => alert(e.type)

  return html`
    <div>
      <h3>Button demo</h3>
      <demo-button @action=${onAction} text="Click me"></demo-button>
    </div>
  `
})
