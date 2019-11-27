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
      <button onClick=${onClick}>${props.text}</button>
    `
  }
})

component('button-demo', {
  render() {
    return html`
      <div>
        <h3>Button demo</h3>
        <my-button text="Click me"/>
      </div>
    `
  }
})
