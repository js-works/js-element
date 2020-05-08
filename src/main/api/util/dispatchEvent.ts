import Ctrl from '../#types/Ctrl'

export default function dispatchEvent(
  c: Ctrl,
  event: any // TODO
) {
  return c.getRoot().addEventListener(event)
}
