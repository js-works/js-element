import htm from 'htm'
import { createCustomElementClass } from './core/createCustomElementClass'
import { prop } from './core/prop'
import { provision } from './core/provision'
import { getOwnProp } from './core/utils'

import {
  Component,
  Ctrl,
  ExternalPropsOf,
  InternalPropsOf,
  Props,
  PropsConfig,
  VNode,
  VElement
} from './core/types'

import { h as createElement, text, patch } from './libs/superfine'

// === exports =======================================================

export { component, provision, prop, h, html, render, VElement, VNode }

// === constants =====================================================

const NOOP = () => {}

// === component =====================================================

function component(name: string, main: (c: Ctrl) => () => VNode): Component

function component<PC extends PropsConfig>(
  name: string,

  config: {
    props?: PC
    slots?: string[]
    methods?: string[]
  },

  main: (ctrl: Ctrl, props: InternalPropsOf<PC>) => () => VNode
): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig>(
  name: string,

  config: {
    props?: PC
    slots?: string[]
    methods?: string[]
  }
): {
  main: (
    fn: (ctrl: Ctrl, props: InternalPropsOf<PC>) => () => VNode
  ) => Component<ExternalPropsOf<PC>>
}

function component(name: string, sndArg?: any, thirdArg?: any): any {
  if (arguments.length > 2) {
    return (component(name, sndArg) as any).main(thirdArg)
  }

  const sndArgIsFunction = typeof sndArg === 'function'

  if (sndArgIsFunction) {
    return component(name, {}, sndArg)
  }

  const options = sndArg

  const main = (fn: Function) => {
    const init = (ctrl: Ctrl, props: Props) => {
      return fn(ctrl, props)
    }

    const customElementClass = createCustomElementClass(
      name,
      (options && options.props) || null,
      (options && options.methods) || null,
      init,
      renderer
    )

    if (
      process.env.NODE_ENV === ('development' as any) &&
      customElements.get(name)
    ) {
      location.reload()
    }

    customElements.define(name, customElementClass)

    const ret = h.bind(null, name)

    Object.defineProperty(ret, 'js-elements:type', {
      value: name
    })

    return ret
  }

  return { main }
}

// === h =============================================================

const EMPTY_ARR = [] as any[]
const EMPTY_OBJ = {}

function h(
  type: string | Component,
  props?: Props | null | undefined,
  ...children: VNode[]
): VElement

function h(t: any, p: any) {
  const argc = arguments.length
  const type = typeof t === 'function' ? t['js-elements:type'] : t

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

function asVNode(x: any): any {
  return typeof x === 'number' || typeof x === 'string' ? text(x) : x
}

// === renderer =================================================

const renderer = (content: VElement, target: Element) => {
  if (target.hasChildNodes()) {
    patch(target.firstChild, content)
  } else {
    const newTarget = document.createElement('span')

    target.appendChild(newTarget)
    patch(newTarget, content)
  }
}

// === render ========================================================

function render(content: VElement, container: Element | string) {
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
