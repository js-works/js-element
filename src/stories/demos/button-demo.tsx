import { element, html, prop } from 'js-elements'
import { useEmitter, useStyles } from 'js-elements/hooks'
import { EventHandler, UIEvent } from 'js-elements/types'
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

@element('demo-button')
class DemoButton {
  @prop()
  text?: string

  @prop()
  onButtonClick?: EventHandler<ButtonClickEvent>

  static main(self: DemoButton) {
    const emit = useEmitter()
    useStyles(buttonDemoStyles)

    const onClick = () => {
      emit(createEvent('button-click'), self.onButtonClick)
    }

    return () => html`
      <button class="demo-button" onClick=${onClick}>${self.text}</button>
    `
  }
}

@element('button-demo')
export default class ButtonDemo {
  static main() {
    const onButtonClick = (ev: ButtonClickEvent) => alert(ev.type)

    return () => html`
      <div>
        <h3>Button demo</h3>
        <${DemoButton} onButtonClick=${onButtonClick} text="Click me" />
      </div>
    `
  }
}
