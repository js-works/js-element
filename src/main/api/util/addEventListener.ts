import Ctrl from '../#types/Ctrl'

export default function addEventListener(
  c: Ctrl,
  type: string,
  listener: any, // TODO
  options: any // TODO
) {
  c.getRoot().addEventListener(type, listener, options)
}
