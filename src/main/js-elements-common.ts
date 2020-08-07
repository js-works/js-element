import {
  createAdaption,
  prop,
  provision,
  FunctionDefineElement,
  Methods
} from './api/core'

import { h as createElement, patch, isElement } from './internal/superfine'

// === exports =======================================================

export { component, provision, prop, h, Html, Svg, VElement, VNode }

// ===================================================================

type Key = string | number
type Props = Record<string, any> & { key?: never; children?: VNode }
type VElement<T extends Props = Props> = any // TODO !!!!!!!!

type VNode =
  | undefined
  | null
  | boolean
  | number
  | string
  | VElement
  | Iterable<VNode>

type Component<P extends Props = {}, M extends Methods = {}> = (
  props?: P & { key?: Key }
) => VNode // TODO

// === defineElement =================================================

const defineElement = createAdaption(superfineRenderer)

// === render ========================================================

function render(content: VElement, container: Element | string) {
  if (content !== null && (!content || content.kind !== 'virtual-element')) {
    throw new TypeError(
      'First argument "content" of function "render" must be a virtual element or null'
    )
  }

  if (!container || (typeof container !== 'string' && !container.tagName)) {
    throw new TypeError(
      'Second argument "container" of funtion "render" must either be a DOM element or selector string for the DOM element'
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
    patch(target, content)
  }
}

// === component ======================================================

function superfineRenderer(content: VElement, target: Element) {
  console.log('22222')
  if (target.hasChildNodes()) {
    patch(target.firstChild, content)
  } else {
    const newTarget = document.createElement('span')

    target.appendChild(newTarget)
    patch(newTarget, content)
  }
}

export default function h(type: any, ...rest: any[]): any {
  // TODO
  const second = rest[0]

  if (typeof type === 'function') {
    type = (type as any)['js-elements:type']
  }

  if (
    (second !== undefined && second !== null && typeof second !== 'object') ||
    isElement(second)
  ) {
    rest.unshift(null)
  }

  return (createElement as any)(type, ...rest) // TODO
}

const component: FunctionDefineElement<VNode, Component<any>> = (
  name: string,
  config: any
) => {
  defineElement(name, config)

  const ret = h.bind(null, name)

  Object.defineProperty(ret, 'js-elements:type', {
    value: name
  })

  return ret
}

// === Html + Svg ====================================================

const Html = createDomFactoryObject()
const Svg = createDomFactoryObject()

function createDomFactoryObject() {
  const handler = {
    get(target: object, propName: string) {
      const factory = h.bind(null, propName)
      ret[propName] = factory
      return factory
    }

    // TODO: other handler methods?
  }

  const ret: any = new Proxy({}, handler)
  return ret
}
