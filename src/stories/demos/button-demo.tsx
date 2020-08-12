import { component, h, prop } from '../../main/js-elements'

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

const DemoButton = component('demo-button', {
  props: {
    text: prop.str.opt(''),
    onClick: prop.func.opt()
  },

  styles: buttonDemoStyles,

  main(c, props) {
    const onClick = () => {
      if (props.onClick) {
        props.onClick(new CustomEvent('buttonaction')) // TODO
      }
    }

    return () => (
      <button className="demo-button" onClick={onClick}>
        {props.text}
      </button>
    )
  }
})

component('button-demo', () => {
  const onButtonAction = (e: any) => alert(e.type) // TODO

  return (
    <div>
      <h3>Button demo</h3>
      <DemoButton onClick={onButtonAction} text="Click me" />
    </div>
  )
})
