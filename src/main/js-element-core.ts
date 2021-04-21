import { patch as superfinePatch } from './lib/superfine-patched'

import {
  createCustomElementClass,
  intercept,
  Attr,
  Ctrl,
  PropConfig
} from './lib/base'

// === exports =======================================================

// new stuff
export { elem, prop }

// public API
export { adapt, attr, event, createCtx, createEvent, createRef, ref }
export { defineProvider, intercept, Attr }
export { Component, Context, Ctrl }
export { MethodsOf, Ref, Listener, TypedEvent }

// TODO - this is evil !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// hidden API
const getHiddenAPI = () => ({
  createComponentType,
  createCustomElementClass,
  registerElement
})

const toString = () => adapt.prototype.toString()

Object.defineProperty(toString, '__getHiddenAPI', {
  value: getHiddenAPI
})

Object.defineProperty(adapt.prototype, 'toString', {
  value: toString
})

const globalPropConfigs = new Map<any, Map<string, PropConfig>>()

// === types ==========================================================

type Props = Record<string, any>
type PropsClass<P extends Props> = { new (): P }
type Ref<T> = { current: T | null }
type Listener<T extends Event> = (ev: T) => void
type TypedEvent<T extends string, D = null> = CustomEvent<D> & { type: T }

type Context<T> = {
  kind: 'context'
  defaultValue: T
}

type Component<P = {}> = {
  (props?: Partial<P> | JSX.HTMLAttributes<HTMLElement>): HTMLElement
  tagName: string
}

type MethodsOf<C> = C extends Component<infer P>
  ? P extends { ref?: Ref<infer M> }
    ? M extends Record<string, (...args: any[]) => any>
      ? M
      : never
    : never
  : never

// === public decorators =============================================

function attr<T>(
  type: {
    mapPropToAttr(value: T): string | null
    mapAttrToProp(value: string | null): T
  },
  reflect: boolean = false
) {
  return (proto: object, propName: string) => {
    const propsClass = proto.constructor as PropsClass<any>
    const attrName = propNameToAttrName(propName)
    let propConfigMap = globalPropConfigs.get(propsClass)

    if (!propConfigMap) {
      propConfigMap = new Map()

      propConfigMap.set(propName, {
        propName,
        attrName: propNameToAttrName(propName),
        hasAttr: true,
        reflect,
        mapPropToAttr: type.mapPropToAttr,
        mapAttrToProp: type.mapAttrToProp
      })

      globalPropConfigs.set(propsClass, propConfigMap)
    }
  }
}

// === public functions ==============================================

function createCtx<T>(defaultValue?: T): Context<T> {
  return Object.freeze({
    kind: 'context',
    defaultValue: defaultValue!
  })
}

function defineProvider<T>(
  tagName: string,
  ctx: Context<T>
): Component<{ value: T }> {
  const eventName = `$$context$$`

  class CtxProviderElement extends HTMLElement {
    private __value?: T = undefined
    private __subscribers: ((value: T) => void)[] = []
    private __cleanup: (() => void) | null = null

    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    get value(): T | undefined {
      return this.__value
    }

    set value(val: T | undefined) {
      if (val !== this.__value) {
        this.__value = val
        this.__subscribers.forEach((subscriber) => subscriber(val!))
      }
    }

    connectedCallback() {
      this.shadowRoot!.innerHTML = '<slot></slot>'

      const eventListener = (ev: any) => {
        if (ev.detail.context !== ctx) {
          return
        }

        ev.stopPropagation()
        this.__subscribers.push(ev.detail.callback)

        ev.detail.cancelled.then(() => {
          this.__subscribers.splice(
            this.__subscribers.indexOf(ev.detail.callback),
            1
          )
        })
      }

      this.addEventListener(eventName, eventListener)
      this.__cleanup = () => this.removeEventListener(eventName, eventListener)
    }

    disconnectCallback() {
      this.__subscribers.length === 0
      this.__cleanup!()
      this.__cleanup = null
    }
  }

  registerElement(tagName, CtxProviderElement)

  return createComponentType(tagName)
}

function createRef<T = any>(value: T | null = null): Ref<T> {
  return { current: value }
}

function createEvent<T extends string, D = null>(
  type: T,
  detail?: D,
  options?: { bubbles: boolean; cancelable?: boolean }
): TypedEvent<T, D> {
  const params = {
    detail: detail || null,
    bubbles: !options || !!options.bubbles,
    cancelable: !options || !!options.cancelable,
    composed: true
  }

  return new CustomEvent(type, params) as any
}

function adapt<M, N>(config: {
  isMountable(what: any): boolean
  patchContent(node: M | N | null, container: Element): void
}) {
  return {
    define: createDefiner<N>(config.patchContent),
    render: createRenderer<M>(config.isMountable, config.patchContent),
    impl: createImplementer<N>(config.patchContent)
  }
}

function createDefiner<C>(
  patch: (content: C, target: Element) => void
): {
  <P extends Props = {}>(config: {
    tag: string
    props?: PropsClass<P>
    slots?: string[]
    uses?: string[]
    styles?: string | string[] | (() => string | string[])
    init: () => () => C
  }): Component<P>

  (name: string, init: () => () => C): Component<{}>

  <P extends Props>(
    tag: string,
    propsClass: PropsClass<P>,
    init: (props: P) => () => C
  ): Component<P>

  <P extends Props = {}>(config: {
    tag: string
    props?: PropsClass<P>
    slots?: string[]
    uses?: (object | Function)[]
    styles?: string | string[] | (() => string | string[])
  }): {
    (init: (props: P) => () => C): Component<P>
    bind(init: (props: P) => () => C): Component<P>
    main(init: (props: P) => () => C): Component<P>
    init(init: (props: P) => () => C): Component<P>
  }
} {
  return function define(arg1: any, arg2?: any, arg3?: any): any {
    if (typeof arg1 === 'string') {
      return arg3
        ? define({ tag: arg1, props: arg2, init: arg3 })
        : define({ tag: arg1, init: arg2 })
    } else if (!arg1.init) {
      // TODO
      const ret = (init: () => () => C) => define({ ...arg1, init })
      ret.bind = ret
      ret.main = ret
      ret.init = ret

      return ret
    }

    const tagName = arg1.tag
    const propsClass = arg1.props || null

    if (propsClass) {
      const props = new propsClass()
      let propConfigMap = globalPropConfigs.get(propsClass)

      if (!propConfigMap) {
        propConfigMap = new Map()
        globalPropConfigs.set(propsClass, propConfigMap)
      }

      for (const key of Object.keys(props)) {
        if (!propConfigMap.has(key)) {
          propConfigMap.set(key, {
            propName: key,
            hasAttr: false
          })
        }
      }
    }

    const customElementClass = buildCustomElementClass(
      tagName,
      propsClass,
      globalPropConfigs.get(propsClass),
      arg1.styles,
      arg1.init,
      patch
    )

    registerElement(tagName, customElementClass)

    return createComponentType<any>(tagName)
  }
}

// === locals ========================================================

function buildCustomElementClass<T extends object, C>(
  name: string,
  propsClass: { new (): T } | null,
  propConfigMap: Map<string, PropConfig> | null | undefined,
  styles: string | string[] | (() => string | string[]),
  main: (props: T) => () => C,
  render: (content: C, target: Element) => void
): CustomElementConstructor {
  let combinedStyles: string | null = null // will be set lazy

  const prepare = (host: HTMLElement, ctrl: Ctrl) => {
    const data: any = propsClass ? new propsClass() : {}

    ;(host as any).__data = data
    ;(host as any).__ctrl = ctrl

    if (propConfigMap && propConfigMap.has('ref')) {
      let componentMethods: any = null
      data.ref = {}

      Object.defineProperty(data.ref, 'current', {
        enumerable: true,
        get: () => componentMethods,

        set: (methods: any) => {
          if (componentMethods) {
            throw new Error('Methods can only be set once')
          } else if (methods) {
            componentMethods = methods
            Object.assign(host, componentMethods)
          }
        }
      })
    }

    if (combinedStyles === null && styles) {
      combinedStyles = combineStyles(styles)
    }

    if (combinedStyles) {
      const styleElem = document.createElement('style')

      styleElem.appendChild(document.createTextNode(combinedStyles))
      host.shadowRoot!.firstChild!.appendChild(styleElem)
    }
  }

  function init(host: any) {
    return main(host.__data)
  }

  const customElementClass = createCustomElementClass(
    name,
    prepare,
    init,
    render,
    propConfigMap ? Array.from(propConfigMap.values()) : [],
    (ctrl, propName, value) => {
      ;(ctrl.getHost() as any).__data[propName] = value
      ctrl.refresh()
    }
  )

  return customElementClass
}

// === tools ========================================================

function propNameToAttrName(propName: string) {
  return propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

// === render ========================================================

function createRenderer<C>(
  isValidContent: (content: C) => boolean,
  patch: (content: C, target: Element) => void
): (content: C | null, container: Element | string) => void {
  return (content: C | null, container: Element | string) => {
    if (process.env.NODE_ENV === ('development' as string)) {
      if (content !== null && (!content || !isValidContent(content))) {
        throw new TypeError(
          `First argument "content" of function "render" must be a` +
            ' valid content to render or null to clear target container'
        )
      }

      if (!container || (typeof container !== 'string' && !container.tagName)) {
        throw new TypeError(
          `Second argument "container" of function "render" must either ` +
            ' be a DOM element or selector string for the DOM element'
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
    content !== null && patch(content, target)
  }
}

// === misc ==========================================================

function registerElement(
  tagName: string,
  elementClass: CustomElementConstructor
): void {
  if (customElements.get(tagName)) {
    console.clear()
    console.log(`Custom element ${tagName} already defined -> reloading...`)

    setTimeout(() => {
      console.clear()
      location.reload()
    }, 1000)
  } else {
    customElements.define(tagName, elementClass)
  }
}

function createComponentType<P extends Props>(tagName: string): Component<P> {
  // TODO!!!!
  const ret = (props?: Props) =>
    Object.assign(document.createElement(tagName), props)

  return Object.defineProperty(ret, 'tagName', { value: tagName })
}

function combineStyles(
  styles: string | string[] | (() => string | string[])
): string {
  if (typeof styles === 'function') {
    styles = styles()
  }

  if (!styles) {
    return ''
  }

  if (Array.isArray(styles)) {
    styles = styles.join('\n\n/* =============== */\n\n')
  }

  return styles
}

// ============================================
// = new stuff ================================
// ============================================

const elemConfigByClass = new Map<
  Function,
  {
    tag: string
    props: Map<string, PropConfig>
  }
>()

function elem(tag: string): (constructor: Function) => void

function elem(config: {
  tag: string
  slots?: string[]
}): (constructor: Function) => void

function elem(config: any): (constructor: Function) => void {
  return (constructor) => {
    const tag = typeof config === 'string' ? config : config.tag
    let elemConfig = elemConfigByClass.get(constructor)

    if (!elemConfig) {
      elemConfig = { tag: tag, props: new Map() }
      elemConfigByClass.set(constructor, elemConfig)
    } else {
      elemConfig.tag = tag
    }
  }
}

function prop<T>(
  attr?: {
    mapPropToAttr(value: T): string | null
    mapAttrToProp(value: string | null): T
  },
  reflect?: boolean
) {
  return (proto: any, propName: string) => {
    const constructor = proto.constructor

    const propConfig: PropConfig = !attr
      ? { propName, hasAttr: false }
      : {
          propName,
          hasAttr: true,
          attrName: propNameToAttrName(propName),
          reflect: !!reflect,
          mapPropToAttr: attr.mapPropToAttr,
          mapAttrToProp: attr.mapAttrToProp
        }

    let elemConfig = elemConfigByClass.get(constructor)

    if (!elemConfig) {
      elemConfig = { tag: '', props: new Map() }
      elemConfigByClass.set(constructor, elemConfig)
    }

    elemConfig.props.set(propName, propConfig)
  }
}

function event<T>(type: string) {
  // TODO!!!!!
  return prop()
}

function ref<T>() {
  // TODO!!!!!
  return prop()
}

function createImplementer<N>(
  patch: (content: N, target: Element) => void
): <T extends Props>(
  constructor: { new (): T },
  fn: (data: T) => () => N
) => Component<T> {
  return (constructor, fn) => {
    const elemConfig = elemConfigByClass.get(constructor)

    if (
      process.env.NODE_ENV === ('development' as string) &&
      (!elemConfig || !elemConfig.tag)
    ) {
      throw new Error('[implement] Class has not been decorated by @element')
    }

    const tag = elemConfig!.tag

    const prepare = (host: any, ctrl: Ctrl) => {
      let hasRefProp = false
      host.__data = new constructor()

      for (const { propName } of propConfigs) {
        if (propName !== 'ref') {
          host[propName] = host.__data[propName]
        } else {
          hasRefProp = true
        }
      }

      if (hasRefProp) {
        let componentMethods: any = null

        host.__data.ref = {}

        Object.defineProperty(host.__data.ref, 'current', {
          enumerable: true,
          get: () => componentMethods,

          set: (methods: any) => {
            if (componentMethods) {
              throw new Error('Methods can only be set once')
            } else if (methods) {
              componentMethods = methods
              Object.assign(host, componentMethods)
            }
          }
        })
      }
    }

    const init = (host: any, ctrl: Ctrl) => {
      return fn(host.__data)
    }

    const onPropChange = (ctrl: Ctrl, propName: string, value: any) => {
      const host: any = ctrl.getHost()

      host.__data[propName] = value
      ctrl.refresh()
    }

    const propConfigs = Array.from(elemConfig!.props.values())

    const customElementClass = createCustomElementClass(
      tag,
      prepare,
      init,
      patch,
      propConfigs,
      onPropChange
    )

    registerElement(tag, customElementClass)

    return createComponentType(tag)
  }
}
