import { patch as superfinePatch } from './lib/superfine-patched'

// === exports =======================================================

// public API
export { adapt, attr, createCtx, createEvent, createRef }
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

// === local data =====================================================

let ignoreAttributeChange = false

const interceptions = {
  init: [] as InterceptFn[],
  render: [] as InterceptFn[]
}

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

type PropConfig =
  | {
      propName: string
      hasAttr: false
    }
  | {
      propName: string
      hasAttr: true
      attrName: string
      reflect: boolean
      mapPropToAttr: (value: any) => string | null
      mapAttrToProp: (value: string | null) => any
    }

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

function createCustomElementClass<C>(
  name: string,
  prepare: (host: HTMLElement, ctrl: Ctrl) => void,
  init: (host: HTMLElement, ctrl: Ctrl) => () => C,
  render: (content: C, target: HTMLElement) => void,
  propConfigs?: PropConfig[] | null,
  onPropChange?: ((ctrl: Ctrl, propName: string, value: any) => void) | null
): { new (): HTMLElement } {
  const ctrls = new WeakMap<HTMLElement, Ctrl>() // TODO!!!!!

  const customElementClass = class extends HTMLElement {
    constructor() {
      super()

      const stylesElement = document.createElement('div')
      const contentElement = document.createElement('div')
      this.attachShadow({ mode: 'open' })
      contentElement.append(document.createElement('span'))
      this.shadowRoot!.append(stylesElement, contentElement)

      let initialized = false
      let mounted = false
      let updated = false
      let shallCommit = false
      let getContent: () => any // TODO

      const beforeMountNotifier = createNotifier()
      const afterMountNotifier = createNotifier()
      const beforeUpdateNotifier = createNotifier()
      const afterUpdateNotifier = createNotifier()
      const beforeUnmountNotifier = createNotifier()
      const onceBeforeUpdateActions: (() => void)[] = []

      const ctrl: Ctrl = {
        getName: () => name,
        getHost: () => this,
        isInitialized: () => initialized,
        isMounted: () => mounted,
        hasUpdated: () => updated,
        beforeMount: beforeMountNotifier.subscribe,
        afterMount: afterMountNotifier.subscribe,
        onceBeforeUpdate: (task: () => void) =>
          onceBeforeUpdateActions.push(task),
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
            if (!getContent) {
              // TODO: why is this happening sometimes?
              return
            }

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

      ;(this as any).connectedCallback = () => {
        if (!initialized) {
          runIntercepted(
            () => {
              getContent = init(this, ctrl)
            },
            ctrl,
            interceptions.init
          )
        }

        beforeMountNotifier.notify()

        commit()
      }
      ;(this as any).disconnectedCallback = () => {
        beforeUnmountNotifier.notify()
        contentElement.innerHTML = ''
      }

      prepare(this, ctrl)
      ctrls.set(this, ctrl) // TODO!!!!!!!!!!!!!!!!!!!!

      ctrl.beforeUnmount(() => ctrls.delete(this))
    }

    connectedCallback() {
      this.connectedCallback()
    }

    disconnectedCallback() {
      this.disconnectedCallback()
    }
  }

  // --- add props handling ------------------------------------------

  if (propConfigs && propConfigs.length > 0) {
    const propConfigByPropName = new Map<string, PropConfig>()
    const propConfigByAttrName = new Map<string, PropConfig>()

    for (const propConfig of propConfigs) {
      propConfigByPropName.set(propConfig.propName, propConfig)

      if (propConfig.hasAttr) {
        propConfigByAttrName.set(propConfig.attrName, propConfig)
      }

      const proto: any = customElementClass.prototype

      ;(customElementClass as any).observedAttributes = Array.from(
        propConfigByAttrName.keys()
      )

      proto.getAttribute = function (attrName: string): string | null {
        const propInfo = propConfigByAttrName.get(attrName)

        return propInfo && propInfo.hasAttr
          ? propInfo.mapPropToAttr((this as any)[propInfo.propName])
          : HTMLElement.prototype.getAttribute.call(this, attrName)
      }

      proto.attributeChangedCallback = function (
        this: any,
        attrName: string,
        oldValue: string | null,
        value: string | null
      ) {
        if (!ignoreAttributeChange) {
          const propInfo = propConfigByAttrName.get(attrName)!

          if (typeof value === 'string') {
            this[propInfo.propName] = ((propInfo as any).mapAttrToProp as any)(
              value
            )
          }
        }
      }

      for (const propConfig of propConfigByPropName.values()) {
        const { propName } = propConfig

        if (propName === 'ref') {
          continue
        }

        const setPropDescriptor = function (target: any) {
          let propValue: any

          Object.defineProperty(target, propName, {
            get() {
              return propValue
            },

            set(value: any) {
              propValue = value

              if (propConfig.hasAttr && propConfig.reflect) {
                try {
                  ignoreAttributeChange = true

                  target.setAttribute(
                    propConfig.attrName,
                    propConfig.mapPropToAttr(value)
                  )
                } finally {
                  ignoreAttributeChange = false
                }
              }

              const ctrl = ctrls.get(this) // TODO!!!!!!!!!!
              ctrl && onPropChange && onPropChange(ctrl, propName, value) // TODO!!!!!!
            }
          })
        }

        Object.defineProperty(proto, propName, {
          configurable: true,

          get() {
            setPropDescriptor(this)
            return undefined
          },

          set(this: any, value: any) {
            setPropDescriptor(this)
            this[propName] = value
          }
        })
      }
    }
  }

  return customElementClass
}
