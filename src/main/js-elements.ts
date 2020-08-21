import htm from './libs/htm'
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

// === types ========================================================

type CtxConfig = Record<string, (c: Ctrl) => any>

type CtxOf<CC extends CtxConfig> = {
  [K in keyof CC]: ReturnType<CC[K]>
}

// === constants =====================================================

const NOOP = () => {}

// === stateless =====================================================

function component(name: string, main: (c: Ctrl) => () => VNode): Component
function component(name: string, render: () => VNode): Component

function component<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
  render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): VNode
}): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[] | (() => string | string[])
    slots?: string[]
    methods?: string[]
    render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): VNode
  }
): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
  main(ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => VNode
}): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[] | (() => string | string[])
    slots?: string[]
    methods?: string[]
    main(ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => VNode
  }
): Component<ExternalPropsOf<PC>>

function component<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
}): {
  stateless: (
    render: (props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => VNode
  ) => Component<ExternalPropsOf<PC>>

  stateful: (
    main: (
      ctrl: Ctrl,
      props: InternalPropsOf<PC>,
      ctx: CtxOf<CC>
    ) => () => VNode
  ) => Component<ExternalPropsOf<PC>>
}

function component<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[] | (() => string | string[])
    slots?: string[]
    methods?: string[]
  }
): {
  stateless: (
    render: (props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => VNode
  ) => Component<ExternalPropsOf<PC>>

  stateful: (
    main: (
      ctrl: Ctrl,
      props: InternalPropsOf<PC>,
      ctx: CtxOf<CC>
    ) => () => VNode
  ) => Component<ExternalPropsOf<PC>>
}

function component(firstArg: any, sndArg?: any): any {
  const name = typeof firstArg === 'string' ? firstArg : firstArg.name

  if (typeof sndArg === 'function') {
    if (sndArg.length > 0) {
      return component({ name, main: sndArg })
    }

    return component({
      name,

      main() {
        let result = sndArg()

        if (typeof result === 'function') {
          return result
        }

        let returnResult = true

        return () => {
          const ret = returnResult ? result : sndArg()
          returnResult = false
          return ret
        }
      }
    })
  }

  const options = { ...(typeof firstArg !== 'string' ? firstArg : sndArg) }
  const render = getOwnProp(options, 'render')
  const main = getOwnProp(options, 'main')
  delete options.name
  delete options.main
  delete options.render

  if (!render && !main) {
    return {
      stateless: (render: Function) => component({ name, ...options, render }),
      stateful: (main: Function) => component({ name, ...options, main })
    }
  }

  const ctxConfig = getOwnProp(options, 'ctx')
  delete options.ctx
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

  const init = (ctrl: Ctrl, props: Props) => {
    initCtx(ctrl)
    return render ? () => render(props, ctx) : main(ctrl, props, ctx)
  }

  const customElementClass = createCustomElementClass(
    name,
    (options && options.props) || null,
    (options && options.styles) || null,
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
