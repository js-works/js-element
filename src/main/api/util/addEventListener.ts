import Ctrl from '../#types/Ctrl'

export default function addEventListener(
  c: Ctrl,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions 
) {
  c.getRoot().addEventListener(type, listener, options)
}
