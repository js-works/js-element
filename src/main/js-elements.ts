import htm from './libs/htm'
import { createCustomElementClass } from './core/createCustomElementClass'
import { propConfigBuilder } from './core/propConfigBuilder'
import { provision } from './core/provision'

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

import { getOwnProp, hasOwnProp } from './core/utils'
import { h as createElement, text, patch } from './libs/superfine'

// === exports =======================================================

export {
  component,
  provision,
  propConfigBuilder as prop,
  h,
  html,
  render,
  Html,
  Svg,
  VElement,
  VNode
}

// === types ========================================================

type CtxConfig = Record<string, (c: Ctrl) => any>

type CtxOf<CC extends CtxConfig> = {
  [K in keyof CC]: ReturnType<CC[K]>
}

// === constants =====================================================

const NOOP = () => {}

// === component =====================================================

function component(name: string, init: (ctrl: Ctrl) => () => VNode): Component
function component(name: string, render: () => VNode): Component

function component<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[]
    slots?: string[]
    render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): VNode
  }
): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[]
    slots?: string[]
    methods?: string[]
    main(ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => VNode
  }
): Component<ExternalPropsOf<PC>>

function component(name: string, configOrFunc: any): Component<any> {
  let options: any = null
  let init: any

  if (typeof configOrFunc === 'function') {
    const fn = configOrFunc

    if (fn.length === 0) {
      init = (ctrl: Ctrl, props: Props) => {
        const result = fn(props)

        return typeof result === 'function' ? result : fn
      }
    } else {
      init = fn
    }
  } else {
    const config = configOrFunc
    const hasRender = hasOwnProp(config, 'render')
    const hasMain = hasOwnProp(config, 'main')

    options = { ...config }
    delete options.render
    delete options.main
    delete options.ctx

    const ctxConfig = getOwnProp(config, 'ctx', null)
    const ctxKeys = ctxConfig ? Object.keys(ctxConfig) : null
    const ctx = {} as any

    const initCtx = !ctxConfig
      ? NOOP
      : (ctrl: Ctrl) => {
          const updateCtx = () => {
            for (let key of ctxKeys!) {
              ctx[key] = ctxConfig[key](ctrl)
            }
          }

          ctrl.beforeUpdate(updateCtx)
          updateCtx()
        }

    if (hasRender && hasMain) {
      throw new TypeError(
        'Illegal component configuration: Only one of the parameters "render" and "main" allowed'
      )
    } else if (hasMain) {
      init = (ctrl: Ctrl, props: Props) => {
        initCtx(ctrl)

        return config.main(ctrl, props, ctx)
      }
    } else {
      init = (ctrl: Ctrl, props: Props) => {
        initCtx(ctrl)

        return () => config.render(props, ctx)
      }
    }
  }

  const customElementClass = createCustomElementClass(
    name,
    (options && options.props) || null,
    (options && options.styles) || null,
    (options && options.methods) || null,
    init,
    renderer
  )

  customElements.define(name, customElementClass)
  const ret = h.bind(null, name)

  Object.defineProperty(ret, 'js-elements:type', {
    value: name
  })

  return ret as any
}

// === h =============================================================

const EMPTY_ARR = [] as any[]
const EMPTY_OBJ = {}

function h(
  type: string | Component,
  props?: Props | null | undefined,
  ...children: VNode[]
): VNode

/*
function h2(
  type: string | Component,
  props?: null | Props,
  ...children: VNode[]
): VNode {
  return typeof type === 'function'
    ? (type as any)(props, children)
    : createElement(
        type,
        props || {},
        []
          .concat(...children)
          .map((any) =>
            typeof any === 'string' || typeof any === 'number' ? text(any) : any
          )
      )
}
*/

function h(
  type: string | Component,
  props?: null | Props,
  ...children: VNode[]
): VNode

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

function h3(t: string | Component, p?: null | Props | VNode): VNode {
  const args = [...arguments]
  const argc = args.length

  const type = typeof t === 'function' ? (t as any)['js-elements:type'] : t
  const props = p && typeof p === 'object' && !p.isVElement ? p : EMPTY_OBJ

  const firstChildIdx =
    p === undefined || p === null || props !== EMPTY_OBJ ? 2 : 1

  let children = EMPTY_ARR

  if (firstChildIdx < argc) {
    children = []

    for (let i = firstChildIdx; i < argc; ++i) {
      const child = args[i]

      if (child !== undefined && child !== null && typeof child !== 'boolean') {
        if (typeof child !== 'object') {
          children.push(text(child))
        } else {
          children.push(child)
        }
      }
    }
  }

  const ret: any = createElement(type, props, children)
  ret.isVElement = true
  return ret
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
  if (content !== null && (!content || content.kind !== 'virtual-element')) {
    //throw new TypeError()
    //      'First argument "content" of function "render" must be a virtual element or null'
  }

  if (!container || (typeof container !== 'string' && !container.tagName)) {
    //throw new TypeError(
    //  'Second argument "container" of funtion "render" must either be a DOM element or selector string for the DOM element'
    // )
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
    patch(content, target)
  }
}

// === html ==========================================================

const html = htm.bind(h)

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
