import {
  attr,
  define,
  createEvent,
  h,
  EventHandler,
  UiEvent,
  Attr
} from 'js-element'
import { useEmitter, useStyles } from 'js-element/hooks'

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

type ButtonClickEvent = UiEvent<'button-click'>

class ButtonProps {
  @attr(Attr.string)
  text?: string

  onButtonClick?: EventHandler<ButtonClickEvent>
}

const DemoButton = define('demo-button', ButtonProps, (props) => {
  const emit = useEmitter()
  useStyles(buttonDemoStyles)

  const onClick = () => {
    emit(createEvent('button-click'), props.onButtonClick)
  }

  return () => (
    <button class="demo-button" onclick={onClick}>
      {props.text}
    </button>
  )
})

const ButtonDemo = define('button-demo', () => {
  const onButtonClick = (ev: ButtonClickEvent) => alert(ev.type)

  return () => (
    <div>
      <h3>Button demo</h3>
      <DemoButton onButtonClick={onButtonClick} text="Click me" />
    </div>
  )
})

export default ButtonDemo
