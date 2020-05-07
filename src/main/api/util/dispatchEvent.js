export default function dispatchEvent(c, event) {
  return c.getRoot().addEventListener(event)
}
