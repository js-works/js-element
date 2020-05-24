import { h as vdom_h, patch } from '../internal/vdom'
export { vdom_h as h, vdom_isValidElement as isValidElement, vdom_render as render }

//import 'preact/debug'
//export { h, isValidElement, render } from 'preact'
//export { h, isValidElement, render } from 'dyo'

function vdom_isValidElement(it) {
  return it !== null && typeof it === 'object' && it.kind === 'virtual-element'
}

function vdom_render(content, target) {
  return patch(target, content)
}
