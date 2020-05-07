export default function removeEventListener(c, type, listener, options) {
  c.getRoot().removeEventListener(type, listener, options)
}
