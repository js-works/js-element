import { html, component, prop } from '../../main/index'

component('demo-button', {
  props: {
    text: prop.str.opt(''),
    onClick: prop.func.opt()
  },

  render(props) {
    const onClick = () => {
      props.onClick && props.onClick(new CustomEvent('click-button1'))
    }

    return html`
      <button @click=${onClick}>${props.text}</button>
    `
  }
})

component('button-demo', {
  render() {
    const onClick = e => alert(e.type)
    return html`
      <div>
        <h3>Button demo</h3>
        <demo-button @click=${onClick} text="Click me"></demo-button>
      </div>
    `
  }
})
