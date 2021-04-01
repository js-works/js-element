// === exports =======================================================

// public API
export { adapt, attr, createCtx, createEvent, createRef }
export { defineCtxProvider, intercept, Attr }
export { Component, Context, Ctrl, EventHandler }
export { MethodsOf, Ref, UiEvent }

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
type EventHandler<T> = (ev: T) => void
type UiEvent<T extends string, D = null> = CustomEvent<D> & { type: T }

type Context<T> = {
  kind: 'context'
  uuid: string
  name?: string
  preset: T
}

type Component<P = {}> = {
  (props?: Partial<P>): HTMLElement
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

function createCtx<T>(name: string, preset: T): Context<T> {
  return Object.freeze({
    kind: 'context',
    name,

    uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c == 'x' ? r : (r & 0x3) | 0x8

      return v.toString(16)
    }),

    preset
  })
}

function defineCtxProvider<T>(
  tagName: string,
  ctx: Context<T>
): Component<{ value: T }> {
  const eventName = `context::${ctx.uuid}`

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
        this.__subscribers.push(ev.detail.notify)

        ev.detail.cancelled.then(() => {
          this.__subscribers.splice(
            this.__subscribers.indexOf(ev.detail.notify),
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
): UiEvent<T, D> {
  const params = {
    detail: detail || null,
    bubbles: !options || !!options.bubbles,
    cancelable: !options || !!options.cancelable,
    composed: true
  }

  return new CustomEvent(type, params) as UiEvent<T, D>
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
  (tagName: string, main: () => () => C): Component<{}>

  <P extends Props>(
    tagName: string,
    propsClass: PropsClass<P>,
    main: (props: P) => () => C
  ): Component<P>
} {
  return (tagName: string, arg2: any, arg3?: any): any => {
    if (process.env.NODE_ENV === ('development' as string)) {
      const argc = arguments.length

      if (typeof tagName !== 'string') {
        throw new TypeError(`[define] First argument must be a string`)
      } else if (typeof arg2 !== 'function') {
        throw new TypeError(`[define] Expected function as second argument`)
      } else if (argc > 2 && typeof arg3 !== 'function') {
        throw new TypeError(`[define] Expected function as third argument`)
      } else if (argc > 3) {
        throw new TypeError(`[define] Unexpected fourth argument`)
      }
    }

    const propsClass = typeof arg3 === 'function' ? arg2 : null
    const main = propsClass ? arg3 : arg2

    const attrInfoMap =
      (propsClass && attrInfoMapByPropsClass.get(propsClass)) || null

    const customElementClass = buildCustomElementClass(
      tagName,
      propsClass,
      propsClass ? getPropInfoMap(propsClass, attrInfoMap) : null,
      attrInfoMap,
      main,
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
  main: (props: T) => () => C,
  patch: (content: C, target: Element) => void
): CustomElementConstructor {
  const customElementClass = class extends BaseElement {
    constructor() {
      super()
      const data: any = propsClass ? new propsClass() : {}
      const beforeMountNotifier = createNotifier()
      const afterMountNotifier = createNotifier()
      const beforeUpdateNotifier = createNotifier()
      const afterUpdateNotifier = createNotifier()
      const beforeUnmountNotifier = createNotifier()
      const onceBeforeUpdateActions: (() => void)[] = []
      const ctrl = createCtrl(this)
      ;(this as any).__ctrl = ctrl
      ;(this as any).__data = data

      let isInitialized = false
      let isMounted = false
      let hasUpdated = false
      let hasRequestedRefresh = false
      let stylesElement: HTMLElement | undefined
      let contentElement: HTMLElement | undefined
      let render: (() => C) | undefined

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

      const root = this.attachShadow({ mode: 'open' })
      stylesElement = document.createElement('span')
      contentElement = document.createElement('span')
      stylesElement.setAttribute('data-role', 'styles')
      contentElement.setAttribute('data-role', 'content')
      root.append(stylesElement, contentElement)

      const fns = interceptions.init

      if (!fns.length) {
        render = main(data)
      } else {
        let next = () => void (render = main(data))

        for (let i = fns.length - 1; i >= 0; --i) {
          const nextFn = next
          next = () => void fns[i](ctrl, nextFn)
        }

        next()
      }

      this.connectedCallback = () => {
        beforeMountNotifier.notify()
        refresh()
      }

      this.disconnectedCallback = () => {
        beforeUnmountNotifier.notify()
        contentElement!.innerHTML = ''
      }

      function refresh() {
        if (isMounted) {
          if (onceBeforeUpdateActions && onceBeforeUpdateActions.length) {
            try {
              onceBeforeUpdateActions.forEach((action) => action())
            } finally {
              onceBeforeUpdateActions.length = 0
            }
          }

          beforeUpdateNotifier.notify()
        }

        let content: C
        const fns = interceptions.render

        if (!fns.length) {
          content = render!()
        } else {
          let next = () => void (content = render!())

          for (let i = fns.length - 1; i >= 0; --i) {
            const nextFn = next
            next = () => void fns[i](ctrl, nextFn)
          }

          next()
        }

        // TODO
        try {
          patch(content!, contentElement!)
        } catch (e) {
          console.error(`Render error in "${ctrl.getName()}"`)
          throw e
        }

        isInitialized = true

        if (!isMounted) {
          isMounted = true
          afterMountNotifier.notify()
        } else {
          hasUpdated = true
          afterUpdateNotifier.notify()
        }
      }

      function createCtrl(host: HTMLElement): Ctrl {
        return {
          getName: () => name,
          getHost: () => host,
          isInitialized: () => isInitialized,
          isMounted: () => isMounted,
          hasUpdated: () => hasUpdated,

          refresh() {
            if (!hasRequestedRefresh) {
              hasRequestedRefresh = true

              requestAnimationFrame(() => {
                hasRequestedRefresh = false
                refresh()
              })
            }
          },

          beforeMount: beforeMountNotifier.subscribe,
          afterMount: afterMountNotifier.subscribe,
          onceBeforeUpdate: (task) => void onceBeforeUpdateActions.push(task),
          beforeUpdate: beforeUpdateNotifier.subscribe,
          afterUpdate: afterUpdateNotifier.subscribe,
          beforeUnmount: beforeUnmountNotifier.subscribe
        }
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
      get: () => proto.__data[propName],

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
