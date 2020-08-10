import { defineElement, html, prop } from '../../main/js-elements-lit-html'

const buttonDemoStyles = ` 
  .demo-button {
    border: none;
    color: white;
    background-color: black;
    padding: 5px 8px;
    outline: none;
  }

  .demo-button:hover {
    background-color: #444;
  }

  .demo-button:active {
    background-color: #555;
  }
`

defineElement('demo-button', {
  props: {
    text: prop.str.opt(''),
    onClick: prop.func.opt()
  },

  styles: buttonDemoStyles,

  main(c, props) {
    const onClick = () => {
      console.log('click', props)
      if (props.onClick) {
        props.onClick(new CustomEvent('buttonaction')) // TODO
      }
    }

    return () => html`
      <button class="demo-button" onClick=${onClick}>${props.text}</button>
    `
  }
})

defineElement('button-demo', () => {
  const onButtonAction = (e: any) => alert(e.type) // TODO

  return html`
    <div>
      <h3>Button demo</h3>
      <demo-button @click="${onButtonAction}" text="Click me" />
    </div>
  `
})
