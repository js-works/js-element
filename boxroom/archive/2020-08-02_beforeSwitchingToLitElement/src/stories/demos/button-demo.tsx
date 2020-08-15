/** @jsx h */
import { defineElement, h, prop, Component } from '../../main/index'

type DemoProps = {
  text?: string
  onButtonAction?: (event: CustomEvent<'action'>) => void
}

const DemoButton: Component<DemoProps> = defineElement({
  name: 'demo-button',

  props: {
    text: prop(String).opt(''),
    onButtonAction: prop(Function).opt()
  },

  styles: [
    `
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
  ],

  init(c, props) {
    const onClick = () => {
      if (props.onButtonAction) {
        props.onButtonAction(new CustomEvent('buttonaction'))
      }
    }

    return () => (
      <button className="demo-button" onClick={onClick}>
        {props.text}
      </button>
    )
  }
})

defineElement('button-demo', () => {
  const onButtonAction = (e: any) => alert(e.type) // TODO

  return (
    <div>
      <h3>Button demo</h3>
      <DemoButton onButtonAction={onButtonAction} text="Click me" />
      <hr />
      {h('demo-button', {
        onbuttonaction: onButtonAction,
        text: 'Click me'
      })}{' '}
      {/* TODO */}
    </div>
  )
})
