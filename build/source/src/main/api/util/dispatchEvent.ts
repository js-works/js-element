import Ctrl from '../#types/Ctrl'

export default function dispatchEvent(
  c: Ctrl,
  event: Event
) {
  return c.getRoot().dispatchEvent(event)
}
