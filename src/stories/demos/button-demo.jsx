/** @jsx h */
import { defineElement, h, prop } from '../../main/index'

defineElement({
  name: 'demo-button',

  props: {
    text: prop.str.opt(''),
    onAction: prop.func.opt()
  },

  styles: [`
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
  `]
}, props => {
  const onClick = () => {
    props.onAction && props.onAction(new CustomEvent('action'))
  }

  return (
    <button class="demo-button" onClick={onClick}>{props.text}</button>
  )
})

defineElement('button-demo', () => {
  const onAction = e => alert(e.type)

  return ( 
    <div>
      <h3>Button demo</h3>
      <demo-button onAction={onAction} text="Click me"></demo-button>
    </div>
  )
})
