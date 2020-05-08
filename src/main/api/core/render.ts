import { patch } from '../../internal/vdom'

export default function render(content: any, container: any) { // TODO
  if (content !== null && (!content || content.kind !== 'virtual-element')) {
    throw new TypeError(
      'First argument "content" of function "render" must be a virtual element or null')
  }
  
  if (!container || (typeof container !== 'string' && !container.tagName)) {
    throw new TypeError(
      'Second argument "container" of funtion "render" must either be a DOM element or selector string for the DOM element')
  }

  const target =
    typeof container === 'string'
      ? document.querySelector(container)
      : container

  if (!target) {
    throw new TypeError(
      `Could not find container DOM element "${container}"`)
  }

  target.innerHTML = ''

  if (content !== null) {
    patch(target, content)
  }
}
