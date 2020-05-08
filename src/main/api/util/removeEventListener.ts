import Ctrl from '../#types/Ctrl'

export default function removeEventListener(
  c: Ctrl,
  type: string,
  listener: any, // TODO
  options: any // TODO
) {
  c.getRoot().removeEventListener(type, listener, options)
}
