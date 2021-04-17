import htm from 'htm'
import { adapt, Component, Ctrl } from 'js-element/core'
import { h as createElement, text, patch } from './lib/superfine-patched'

// TODO - this is evil !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const {
  createComponentType,
  createCustomElementClass,
  registerElement
} = adapt.prototype.toString.__getHiddenAPI()

export {
  attr,
  createCtx,
  createEvent,
  createRef,
  defineProvider,
  intercept,
  Attr,
  Ctrl,
  Component,
  Context,
  Listener,
  MethodsOf,
  Ref,
  TypedEvent
} from 'js-element/core'

export const { define, render } = adapt<VElement, VNode>({
  isMountable: (it) => !!it && it.isVElement === true,
  patchContent: renderContent
})

export { h, asComponent, VNode, VElement }
export const html = htm.bind(h)

// === data ==========================================================

let nextTagNameId = 1
const tagNameCounts = new Map<string, number>()

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

// === toComponent ===================================================

function asComponent<P extends Props = any>(
  tagName: string,
  customElementClass: { new (): HTMLElement },
  deps?: any[]
): Component<P> {
  return createComponentType(tagName)
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

function h<P extends Props>(
  type: (props: P) => () => VNode,
  ...children: VNode[]
): VElement

function h(
  type: string | Component<any> | ((props: any) => () => VNode),
  props?: any | null
): VElement {
  const argc = arguments.length
  let tagName = typeof type === 'function' ? (type as any).tagName : type

  if (!tagName && typeof type === 'function') {
    const prepare = (host: any, ctrl: Ctrl) => {
      host.__alwaysSetProps = true
      host.__props = {}
      host.__ctrl = ctrl
    }

    const name = type.name ? toKebabCase(type.name.replace('$', 'x')) : 'ce'

    if (!tagNameCounts.has(name)) {
      tagNameCounts.set(name, 1)
      tagName = name + '--n1'
    } else {
      const count = tagNameCounts.get(name)!

      tagNameCounts.set(name, count + 1)
      tagName = name + '--n' + (count + 1)
    }

    type = createCustomElementClass(tagName, prepare, type, render)

    Object.defineProperty(type, 'tagName', {
      value: tagName
    })

    registerElement(tagName, type)
  }

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

function toKebabCase(s: string) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
