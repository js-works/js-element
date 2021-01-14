import {
  attr,
  component,
  h,
  EventHandler,
  UIEvent,
  register
} from 'js-elements'
import { useEmitter, useStyles } from 'js-elements/hooks'
import { createEvent } from 'js-elements/utils'

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

type ButtonClickEvent = UIEvent<'button-click'>

class ButtonProps {
  @attr(String)
  text?: string

  onButtonClick?: EventHandler<ButtonClickEvent>
}

const DemoButton = component(ButtonProps, (props) => {
  const emit = useEmitter()
  useStyles(buttonDemoStyles)

  const onClick = () => {
    emit(createEvent('button-click'), props.onButtonClick)
  }

  return () => (
    <button class="demo-button" onClick={onClick}>
      {props.text}
    </button>
  )
})

const ButtonDemo = component(() => {
  const onButtonClick = (ev: ButtonClickEvent) => alert(ev.type)

  return () => (
    <div>
      <h3>Button demo</h3>
      <DemoButton onButtonClick={onButtonClick} text="Click me" />
    </div>
  )
})

register({
  'demo-button': DemoButton,
  'button-demo': ButtonDemo
})

export default ButtonDemo
