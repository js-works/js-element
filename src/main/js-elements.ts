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

export { provision, prop, h, html, render, sfc, slc, VElement, VNode }

// === types ========================================================

type CtxConfig = Record<string, (c: Ctrl) => any>

type CtxOf<CC extends CtxConfig> = {
  [K in keyof CC]: ReturnType<CC[K]>
}

// === constants =====================================================

const NOOP = () => {}

// === slc =====================================================

function slc(name: string, render: () => VNode): Component

function slc<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
  render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): VNode
}): Component<ExternalPropsOf<PC>>

function slc<PC extends PropsConfig, CC extends CtxConfig>(
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

function slc(name: string, render: () => VNode): Component<{}>

function slc<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
}): (
  render: (props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => VNode
) => Component<ExternalPropsOf<PC>>

function slc<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[] | (() => string | string[])
    slots?: string[]
    methods?: string[]
  }
): (
  render: (props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => VNode
) => Component<ExternalPropsOf<PC>>

function slc(firstArg: any, sndArg?: any): any {
  const firstArgIsString = typeof firstArg === 'string'
  const sndArgIsFunction = typeof sndArg === 'function'
  const name: string = firstArgIsString ? firstArg : firstArg.name

  if (sndArgIsFunction) {
    const main = (c: Ctrl, props: any, ctx: any) => () => sndArg(props, ctx)

    return firstArgIsString ? sfc({ name, main }) : sfc({ ...firstArg, main })
  }

  const { render, ...options } = firstArgIsString ? sndArg : firstArg
  delete options.name
  delete options.render

  if (render) {
    return sfc({
      name,
      ...options,
      main: (c, props, ctx) => () => render(props, ctx)
    })
  }

  return (render: Function) =>
    sfc({
      name,
      ...options,
      main: (c, props, ctx) => () => render(props, ctx)
    })
}

function sfc(name: string, main: (c: Ctrl) => () => VNode): Component

function sfc<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
  main(ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => VNode
}): Component<ExternalPropsOf<PC>>

function sfc<PC extends PropsConfig, CC extends CtxConfig>(
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

function sfc(name: string, main: (c: Ctrl) => () => VNode): Component<{}>

function sfc<PC extends PropsConfig, CC extends CtxConfig>(config: {
  name: string
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string | string[])
  slots?: string[]
  methods?: string[]
}): (
  main: (ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => () => VNode
) => Component<ExternalPropsOf<PC>>

function sfc<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,

  config: {
    props?: PC
    ctx?: CC
    styles?: string | string[] | (() => string | string[])
    slots?: string[]
    methods?: string[]
  }
): (
  main: (ctrl: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>) => () => VNode
) => Component<ExternalPropsOf<PC>>

function sfc(firstArg: any, sndArg?: any): any {
  const firstArgIsString = typeof firstArg === 'string'
  const sndArgIsFunction = typeof sndArg === 'function'
  const name: string = firstArgIsString ? firstArg : firstArg.name

  if (sndArgIsFunction) {
    return firstArgIsString
      ? sfc({ name, main: sndArg })
      : sfc({ ...firstArg, main: sndArg })
  }

  const { main, ...options } = firstArgIsString ? sndArg : firstArg
  delete options.name
  delete options.main

  if (!main) {
    return (main: Function) => sfc({ name, ...options, main })
  }

  delete options.name
  delete options.main

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
    return main(ctrl, props, ctx)
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
