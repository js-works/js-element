import Ctrl from '../#types/Ctrl'

export default function removeEventListener(
  c: Ctrl,
  type: string,
  listener: EventListenerOrEventListenerObject, 
  options?: boolean | EventListenerOptions
) {
  c.getRoot().removeEventListener(type, listener, options)
}
