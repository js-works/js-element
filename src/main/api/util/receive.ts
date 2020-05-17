import Ctrl from '../#types/Ctrl'

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

export default function receive(c: Ctrl, handler: (msg: any) => void): () => void {
  const
    root = c.getRoot(),

    listener = (ev: Event) => {
      handler((ev as any).detail)
    },

    unsubscribe = () => {
      root.removeEventListener(MESSAGE_EVENT_TYPE, listener)
    }

  root.addEventListener(MESSAGE_EVENT_TYPE, listener)
  c.beforeUnmount(unsubscribe)
  
  return unsubscribe
}
