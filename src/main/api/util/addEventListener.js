export default function addEventListener(c, type, listener, options) {
  c.getRoot().addEventListener(type, listener, options)
}
