import Ctrl from '../#types/Ctrl'

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

export default function send(c: Ctrl, msg: any) {
  const root = c.getRoot()

  root.dispatchEvent(new CustomEvent(MESSAGE_EVENT_TYPE, {
    bubbles: true,
    detail: msg
  }))
}
