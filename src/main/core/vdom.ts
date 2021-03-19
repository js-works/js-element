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
  props?: Props | null, // TODO!!!
  ...children: VNode[]
): VElement

function h<P extends Props>(
  type: Component<P>,
  props?: Partial<P> | null,
  ...children: VNode[]
): VElement

function h(type: string | Component<any>, props?: Props | null): VElement {
  const argc = arguments.length
  const tagName = typeof type === 'function' ? (type as any).tagName : type

  if (process.env.NODE_ENV === ('development' as string)) {
    if (typeof tagName !== 'string') {
      throw new Error('[h] First argument must be a string or a component')
    }
  }

  const children = argc > 2 ? [] : EMPTY_ARR

  if (argc > 2) {
    for (let i = 2; i < argc; ++i) {
      const child = arguments[i]

      if (!Array.isArray(child)) {
        children.push(asVNode(child))
      } else {
        for (let j = 0; j < child.length; ++j) {
          children.push(asVNode(child[j]))
        }
      }
    }
  }

  const ret: any = createElement(tagName, props || EMPTY_OBJ, children)
  ret.isVElement = true
  return ret
}

// === render ========================================================

export function render(content: VElement, container: Element | string) {
  if (process.env.NODE_ENV === ('development' as string)) {
    if (content !== null && (!content || content.isVElement !== true)) {
      throw new TypeError()
      ;('First argument "content" of function "render" must be a virtual element or null')
    }

    if (!container || (typeof container !== 'string' && !container.tagName)) {
      throw new TypeError(
        'Second argument "container" of function "render" must either be a DOM element or selector string for the DOM element'
      )
    }
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
  return typeof x === 'number' || typeof x === 'string'
    ? createText(x, null)
    : x
}
