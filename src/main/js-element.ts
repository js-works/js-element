import htm from 'htm'
import { adapt, Component } from 'js-element/core'
import { h as createElement, text, patch } from './lib/superfine'

export {
  attr,
  event,
  hook,
  ref,
  Attr,
  Component,
  EventHandler,
  MethodsOf,
  Ref,
  UIEvent
} from 'js-element/core'

export const { define, render } = adapt<VElement, VNode>({
  isMountable: (it) => !!it && it.isVElement === true,
  patchContent: renderContent
})

export { h, VNode, VElement }
export const html = htm.bind(h)

// === types =========================================================

type Props = Record<string, any> // TODO
type VElement<T extends Props = any> = Record<any, any> // TODO!!!!!
type VNode = null | boolean | number | string | VElement | Iterable<VNode>

// === helpers =======================================================

function renderContent(content: VNode, target: Element) {
  if (target.hasChildNodes()) {
    patch(target.firstChild, content)
  } else {
    const newTarget = document.createElement('span')

    target.append(newTarget)
    patch(newTarget, content)
  }
}

function asVNode(x: any): any {
  return typeof x === 'number' || typeof x === 'string' ? text(x, null) : x
}

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

// === constants =====================================================

const EMPTY_ARR: any[] = []
const EMPTY_OBJ = {}
