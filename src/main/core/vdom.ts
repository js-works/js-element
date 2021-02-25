import { h as createElement, text as createText, patch } from './superfine'
import htm from 'htm'
import { Component, Props, VElement, VNode } from './types'

// === exports =======================================================

export { h, html }

// === constants =====================================================

const EMPTY_ARR: any[] = []
const EMPTY_OBJ = {}

// === h ==============================================================

function h(
  type: string,
  props?: Props | null, // TODO!!!!!
  ...children: VNode[]
): VElement

function h<P extends Props>(
  type: Component<P>,
  props?: Partial<P> | null,
  ...children: VNode[]
): VElement

function h(t: any, p: any) {
  const argc = arguments.length
  const type = typeof t === 'function' ? t.tagName : t

  if (typeof t === 'function' && type === undefined) {
    throw new Error('Component cannot be rendered as it is not registered yet')
  }

  const props =
    p === undefined ||
    p === null ||
    typeof p !== 'object' ||
    p.isVElement === true ||
    typeof p[Symbol.iterator] === 'function'
      ? EMPTY_OBJ
      : p

  const firstChildIdx =
    p === undefined || p === null || props !== EMPTY_OBJ ? 2 : 1

  let children = EMPTY_ARR

  if (firstChildIdx === argc - 1) {
    children = asVNode(arguments[firstChildIdx])
  } else if (firstChildIdx < argc - 1) {
    children = []

    for (let i = firstChildIdx; i < argc; ++i) {
      children.push(asVNode(arguments[i]))
    }
  }

  const ret: any = createElement(type, props, children)
  ret.isVElement = true
  return ret
}

// === render ========================================================

export function render(content: VElement, container: Element | string) {
  if (content !== null && (!content || content.isVElement !== true)) {
    throw new TypeError()
    ;('First argument "content" of function "render" must be a virtual element or null')
  }

  if (!container || (typeof container !== 'string' && !container.tagName)) {
    throw new TypeError(
      'Second argument "container" of function "render" must either be a DOM element or selector string for the DOM element'
    )
  }

  const target =
    typeof container === 'string'
      ? document.querySelector(container)
      : container

  if (!target) {
    throw new TypeError(`Could not find container DOM element "${container}"`)
  }

  target.innerHTML = ''

  if (content !== null) {
    renderer(content, target)
  }
}

// === html ==========================================================

const html = htm.bind(h)

// === helpers =======================================================

export const renderer = (content: VNode, target: Element) => {
  if (target.hasChildNodes()) {
    patch(target.firstChild, content)
  } else {
    const newTarget = document.createElement('span')

    target.appendChild(newTarget)
    patch(newTarget, content)
  }
}

function asVNode(x: any): any {
  return typeof x === 'number' || typeof x === 'string' ? createText(x) : x
}
