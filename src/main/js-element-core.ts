import { patch as superfinePatch } from './lib/superfine-patched'

const superfineRender = (content: any, target: HTMLElement) => {
  if (!target.firstChild) {
    target.append(document.createElement('div'))
  }

  superfinePatch(target.firstChild, content)
}

// === exports =======================================================

// public API
export { adapt, attr, createCtx, createEvent, createRef }
export { defineProvider, intercept, Attr }
export { Component, Context, Ctrl }
export { MethodsOf, Ref, Listener, TypedEvent }

// === constants =====================================================

const GENERIC_TAG_NAME = 'jse-cc'

// === local data =====================================================

const attrInfoMapByPropsClass = new Map<PropsClass<any>, AttrInfoMap>()
let ignoreAttributeChange = false

const interceptions = {
  init: [] as InterceptFn[],
  render: [] as InterceptFn[]
}

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

type AttrInfo<T> = {
  propName: string
  hasAttr: true
  attrName: string
  reflect: boolean
  mapPropToAttr: (value: T) => string | null
  mapAttrToProp: (value: string | null) => T
}

type PropInfo<T> = { propName: string; hasAttr: false } | AttrInfo<T>
type AttrInfoMap = Map<string, AttrInfo<any>>
type PropInfoMap = Map<string, PropInfo<any>>

type MethodsOf<C> = C extends Component<infer P>
  ? P extends { ref?: Ref<infer M> }
    ? M extends Record<string, (...args: any[]) => any>
      ? M
      : never
    : never
  : never

type Ctrl = {
  getName(): string
  getHost(): HTMLElement
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  beforeMount(taks: () => void): void
  afterMount(task: () => void): void
  onceBeforeUpdate(task: () => void): void
  beforeUpdate(task: () => void): void
  afterUpdate(task: () => void): void
  beforeUnmount(task: () => void): void
}

type InterceptFn = (ctrl: Ctrl, next: () => void) => void

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
    let attrInfoMap = attrInfoMapByPropsClass.get(propsClass)

    if (!attrInfoMap) {
      attrInfoMap = new Map()
      attrInfoMapByPropsClass.set(propsClass, attrInfoMap)
    }

    attrInfoMap.set(attrName, {
      propName,
      hasAttr: true,
      attrName,
      reflect,
      mapPropToAttr: type.mapPropToAttr,
      mapAttrToProp: type.mapAttrToProp
    })
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

function createRef<T>(value: T | null = null): Ref<T> {
  return { current: value }
}

function intercept(point: 'init' | 'render', fn: InterceptFn) {
  interceptions[point].push(fn)
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
    render: createRenderer<M>(config.isMountable, config.patchContent)
  }
}

function createDefiner<C>(
  patch: (content: C, target: Element) => void
): {
  <P extends Props = {}>(config: {
    name: string
    props?: PropsClass<P>
    slots?: string[]
    uses?: string[]
    styles?: string | string[] | (() => string | string[])
    init: () => () => C
  }): Component<P>

  (name: string, init: () => () => C): Component<{}>

  <P extends Props>(
    name: string,
    propsClass: PropsClass<P>,
    init: (props: P) => () => C
  ): Component<P>

  <P extends Props = {}>(config: {
    name: string
    props?: PropsClass<P>
    slots?: string[]
    uses?: (object | Function)[]
    styles?: string | string[] | (() => string | string[])
  }): {
    (init: (props: P) => () => C): Component<P>
    main(init: (props: P) => () => C): Component<P>
  }
} {
  return function define(arg1: any, arg2?: any, arg3?: any): any {
    if (typeof arg1 === 'string') {
      return arg3
        ? define({ name: arg1, props: arg2, init: arg3 })
        : define({ name: arg1, init: arg2 })
    } else if (!arg1.init) {
      // TODO
      const ret = (init: () => () => C) => define({ ...arg1, init })
      ret.main = ret

      return ret
    }

    const tagName = arg1.name
    const propsClass = arg1.props || null

    const attrInfoMap =
      (propsClass && attrInfoMapByPropsClass.get(propsClass)) || null

    const customElementClass = buildCustomElementClass(
      tagName,
      propsClass,
      propsClass ? getPropInfoMap(propsClass, attrInfoMap) : null,
      attrInfoMap,
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
  propInfoMap: PropInfoMap | null,
  attrInfoMap: AttrInfoMap | null,
  styles: string | string[] | (() => string | string[]),
  main: (props: T) => () => C,
  render: (content: C, target: Element) => void
): CustomElementConstructor {
  let combinedStyles: string | null = null // will be set lazy

  const customElementClass = class extends BaseElement {
    constructor() {
      super()

      const data: any = propsClass ? new propsClass() : {}
      ;(this as any).__data = data
      ;(this as any).__ctrl = enhanceHost(this, main, render, data)

      if (propInfoMap && propInfoMap.has('ref')) {
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
              Object.assign(this, componentMethods)
            }
          }
        })
      }

      if (combinedStyles === null && styles) {
        combinedStyles = combineStyles(styles)
      }

      if (combinedStyles) {
        // TODO!!!!!!!!!!!!!!!!!!!!!!!
        //  this.shadowRoot!.firstChild!.appendChild(
        //   document.createTextNode(combinedStyles)
        // )
      }
    }
  }

  propInfoMap && addPropsHandling(customElementClass, propInfoMap, attrInfoMap)

  return customElementClass
}

// === BaseElement ===================================================

class BaseElement extends HTMLElement {
  connectedCallback() {
    this.connectedCallback()
  }

  disconnectedCallback() {
    this.disconnectedCallback()
  }
}

// === tools ========================================================

function propNameToAttrName(propName: string) {
  return propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

function getPropInfoMap(
  propsClass: PropsClass<any>,
  attrInfoMap: AttrInfoMap | null
): PropInfoMap {
  const ret: PropInfoMap = new Map()

  Object.keys(new propsClass()).forEach((propName) => {
    const attrName = propNameToAttrName(propName)

    ret.set(
      propName,
      attrInfoMap && attrInfoMap.has(attrName)
        ? attrInfoMap.get(attrName)!
        : { propName, hasAttr: false }
    )
  })

  return ret
}

function addPropsHandling(
  customElementClass: { new (): BaseElement },
  propInfoMap: PropInfoMap,
  attrInfoMap: AttrInfoMap | null
) {
  const proto = customElementClass.prototype

  ;(customElementClass as any).observedAttributes = attrInfoMap
    ? Array.from(attrInfoMap.keys())
    : []

  proto.getAttribute = function (attrName: string): string | null {
    const attrInfo = attrInfoMap && attrInfoMap.get(attrName)

    return attrInfo
      ? attrInfo.mapPropToAttr(this[attrInfo.propName])
      : HTMLElement.prototype.getAttribute.call(this, attrName)
  }

  proto.attributeChangedCallback = function (
    this: any,
    attrName: string,
    oldValue: string | null,
    value: string | null
  ) {
    if (!ignoreAttributeChange) {
      const attrInfo = attrInfoMap!.get(attrName)!

      if (typeof value === 'string') {
        this[attrInfo.propName] = attrInfo.mapAttrToProp(value)
      }
    }
  }

  for (const propInfo of propInfoMap.values()) {
    const { propName } = propInfo

    if (propName === 'ref') {
      continue
    }

    Object.defineProperty(proto, propName, {
      get() {
        this.__data[propName]
      },

      set(this: any, value: any) {
        this.__data[propName] = value

        if (propInfo.hasAttr && propInfo.reflect) {
          try {
            ignoreAttributeChange = true

            this.setAttribute(propInfo.attrName, propInfo.mapPropToAttr(value))
          } finally {
            ignoreAttributeChange = false
          }
        }

        this.__ctrl.refresh()
      }
    })
  }
}

function runIntercepted<T = null>(
  action: () => void,
  payload: T,
  interceptors: ((payload: T, next: () => void) => void)[]
) {
  if (interceptors.length === 0) {
    action()
  } else {
    let next: () => void = () => action()

    for (let i = interceptors.length - 1; i >= 0; --i) {
      const nextFn = next

      next = () => void interceptors[i](payload, nextFn)
    }

    next()
  }
}

// === createNotifier ================================================

function createNotifier() {
  const subscribers: (() => void)[] = []

  return {
    subscribe: (subscriber: () => void) => void subscribers.push(subscriber),
    notify: () => void (subscribers.length && subscribers.forEach((it) => it()))
  }
}

// === built-in attr types  ==========================================

const Attr = {
  string: {
    mapPropToAttr: (it: string | null) => it,
    mapAttrToProp: (it: string | null) => it
  },

  number: {
    mapPropToAttr: (it: number | null) => (it === null ? null : String(it)),
    mapAttrToProp: (it: string | null) =>
      it === null ? null : Number.parseFloat(it)
  },

  boolean: {
    mapPropToAttr: (it: boolean | null) => (!it ? null : ''),
    mapAttrToProp: (it: string | null) => (it === null ? false : true)
  }
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
    location.reload()
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

// === GenericElement ================================================

class GenericElement extends BaseElement {
  constructor() {
    super()
    ;(this as any).__props = {}

    enhanceHost(
      this,
      (props: any) => (this as any).__fn(props),
      superfineRender,
      (this as any).__props
    )
  }
}

Object.setPrototypeOf(
  GenericElement.prototype,
  new Proxy(HTMLElement.prototype, {
    set(target, key, value, receiver) {
      if (key === 'data-type') {
        receiver.setAttribute('data-type', value)
        return true
      } else if (key in target) {
        Reflect.set(target, key, value, receiver)

        return true
      } else {
        receiver.__props[key] = value
      }

      return true
    },

    has(target, propName) {
      return true
    }
  })
)

registerElement(GENERIC_TAG_NAME, GenericElement)

// TODO - return value, see `any`
function enhanceHost(
  host: BaseElement,
  mainFn: (props: any) => () => any,
  render: (content: any, target: HTMLElement) => void,
  props: any
): Ctrl {
  let initialized = false
  let mounted = false
  let updated = false
  let shallCommit = false
  let getContent: () => any // TODO

  const contentElement = document.createElement('div')
  const beforeMountNotifier = createNotifier()
  const afterMountNotifier = createNotifier()
  const beforeUpdateNotifier = createNotifier()
  const afterUpdateNotifier = createNotifier()
  const beforeUnmountNotifier = createNotifier()
  const onceBeforeUpdateActions: (() => void)[] = []

  const ctrl: Ctrl = {
    getName: () => host.tagName, // TODO!!!!
    getHost: () => host,
    isInitialized: () => initialized,
    isMounted: () => mounted,
    hasUpdated: () => updated,
    beforeMount: beforeMountNotifier.subscribe,
    afterMount: afterMountNotifier.subscribe,
    onceBeforeUpdate: (task: () => void) => onceBeforeUpdateActions.push(task),
    beforeUpdate: beforeUpdateNotifier.subscribe,
    afterUpdate: afterUpdateNotifier.subscribe,
    beforeUnmount: beforeUnmountNotifier.subscribe,

    refresh: () => {
      if (!shallCommit) {
        shallCommit = true

        requestAnimationFrame(() => {
          shallCommit = false
          commit()
        })
      }
    }
  }

  const commit = () => {
    if (mounted) {
      if (onceBeforeUpdateActions.length) {
        try {
          onceBeforeUpdateActions.forEach((action) => action())
        } finally {
          onceBeforeUpdateActions.length = 0
        }
      }

      beforeUpdateNotifier.notify()
    }

    // TODO xxxx
    runIntercepted(
      () => {
        const content = getContent()
        // TODO
        try {
          render(content, contentElement)
        } catch (e) {
          console.error(`Render error in "${ctrl.getName()}"`)
          throw e
        }
      },
      ctrl,
      interceptions.render
    )

    initialized = true

    if (!mounted) {
      mounted = true
      afterMountNotifier.notify()
    } else {
      updated = true
      afterUpdateNotifier.notify()
    }
  }

  host.connectedCallback = () => {
    if (!initialized) {
      const styleElement = document.createElement('style')

      contentElement.append(document.createElement('div'))
      host.attachShadow({ mode: 'open' })
      host.shadowRoot!.append(styleElement, contentElement)

      runIntercepted(
        () => {
          getContent = mainFn(props)
        },
        ctrl,
        interceptions.init
      )
    }

    commit()
  }

  host.disconnectedCallback = () => {
    beforeUnmountNotifier.notify()
    contentElement.innerHTML = ''
  }

  return ctrl
}
