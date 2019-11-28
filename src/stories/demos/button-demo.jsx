import { html, component, prop } from '../../main/index'

component('button-1', {
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

component('button-2', {
  props: {
    text: prop.str.opt(''),
    onClickButton2: prop.func.opt()
  },

  render(props) {
    const onClick = () => {
      if (props.onClickButton2) {
          console.log('onClickButton2')
        props.onClickButton2(new CustomEvent('click-button2'))
      }
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
        <button-2 @clickButton2=${onClick} text="Click me!"/>
        <button-1 @click=${onClick} text="Click me"/>
      </div>
    `
  }
})
