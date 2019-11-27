import { html, component, prop } from '../../main/index'

component('my-button', {
  props: {
    text: prop.str.opt(''),
    onClick: prop.func.opt()
  },

  render(props) {
    const onClick = () => {
      props.onClick && props.onClick(new CustomEvent('click'))
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
        <my-button .onclick=${onClick} text="Click me"/>
      </div>
    `
  }
})
