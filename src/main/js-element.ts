// === exports =======================================================

// functions and singletons
export {
  component,
  createCtx,
  defineProvider,
  elem,
  intercept,
  prop,
  setMethods,
  Attrs
}

// types
export { Context, Ctrl, MethodsOf }

// === data ==========================================================

const elemConfigByClass = new Map<
  Function,
  {
    tag: string
    impl: any // TODO!!!!!,
    styles: string | string[] | (() => string | string[]) | null
    props: Map<string, PropConfig>
  }
>()

let ignoreAttributeChange = false

const interceptions = {
  init: [] as InterceptFn[],
  render: [] as InterceptFn[]
}

// === types =========================================================

declare const methodsSymbol: unique symbol

type Methods = Record<string, (...args: any[]) => any>

type Component<M extends Methods = {}> = HTMLElement &
  M & { [methodsSymbol]: M }

type MethodsOf<T> = T extends Component<infer M> ? M : never

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

type Context<T> = {
  kind: 'context'
  defaultValue: T
}

// === decorators (all public) =======================================

function elem<E extends Component, C>(params: {
  tag: string
  impl: {
    patch: (content: C, container: HTMLElement) => void
    init: (self: E, ctrl: Ctrl) => () => C
  }
  styles?: string | string[] | (() => string | string[])
  uses?: any[]
}) {
  return (clazz: new () => E): void => {
    definePropValue(clazz, 'tagName', params.tag)

    let elemConfig = elemConfigByClass.get(clazz)

    if (!elemConfig) {
      elemConfig = {
        tag: params.tag,
        impl: params.impl,
        styles: params.styles || null,
        props: new Map()
      }

      elemConfigByClass.set(clazz, elemConfig)
    } else {
      elemConfig.tag = params.tag
      elemConfig.styles = params.styles || null
      elemConfig.impl = params.impl
    }

    const propConfigs = Array.from(elemConfigByClass.get(clazz)!.props.values())

    if (propConfigs.length > 0) {
      addAttributeHandling(clazz, propConfigs)
    }

    registerElement(params.tag, clazz)
  }
}

function prop<T>(proto: Component, propName: string): void

function prop<T>(params?: {
  attr: {
    mapPropToAttr(value: T): string | null
    mapAttrToProp(value: string | null): T
  }
  refl?: boolean
}): (proto: Component, propName: string) => void

function prop(arg1?: any, arg2?: any): any {
  if (typeof arg2 === 'string') {
    return prop()(arg1, arg2)
  }

  const params = arg1 // TODO!!!

  const { attr, refl: reflect } = params || {}

  return (proto: Component, propName: string) => {
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
      elemConfig = { tag: '', impl: null, styles: null, props: new Map() }
      elemConfigByClass.set(constructor, elemConfig)
    }

    elemConfig.props.set(propName, propConfig)
  }
}

// === other public functions ========================================

function component<M extends Methods = {}>(): new () => Component<M> {
  return BaseElement as any
}

function setMethods<M extends Methods>(obj: Component<M>, methods: M) {
  Object.assign(obj, methods)
}

function intercept(point: 'init' | 'render', fn: InterceptFn) {
  interceptions[point].push(fn)
}

// === base custom element class =====================================

class BaseElement extends HTMLElement {
  private __ctrl!: Ctrl
  private __hasAddedPropHandling = false

  constructor() {
    super()
    const { init, patch } = elemConfigByClass.get(this.constructor)!.impl

    let styles = elemConfigByClass.get(this.constructor)!.styles

    if (typeof styles !== 'string') {
      styles = typeof styles === 'function' ? styles() : styles

      if (Array.isArray(styles)) {
        styles = styles.map((it) => it.trim()).join('\n\n/*******/\n\n')
      }

      if (!styles) {
        styles = ''
      }

      elemConfigByClass.get(this.constructor)!.styles = styles
    }

    const stylesElement = document.createElement('span')

    if (styles) {
      const styleElem = document.createElement('style')
      styleElem.appendChild(document.createTextNode(styles))
      stylesElement.appendChild(styleElem)
    }

    const contentElement = document.createElement('span')
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
      getName: () => this.localName,
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

    this.__ctrl = ctrl

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

      runIntercepted(
        () => {
          const content = getContent()
          // TODO
          try {
            patch(content, contentElement)
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
      if (!this.__hasAddedPropHandling) {
        addPropHandling(this)
        this.__hasAddedPropHandling = true
      }

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
  }

  // will be overridden in constructor
  connectedCallback() {
    this.connectedCallback()
  }

  // will be overridden in constructor
  disconnectedCallback() {
    this.disconnectedCallback()
  }
}

function addAttributeHandling(
  clazz: new () => Component,
  propConfigs: PropConfig[]
) {
  const proto: any = clazz.prototype
  const propConfigByPropName = new Map<string, PropConfig>()
  const propConfigByAttrName = new Map<string, PropConfig>()

  for (const propConfig of propConfigs) {
    propConfigByPropName.set(propConfig.propName, propConfig)

    if (propConfig.hasAttr) {
      propConfigByAttrName.set(propConfig.attrName, propConfig)
    }
  }

  ;(clazz as any).observedAttributes = Array.from(propConfigByAttrName.keys())

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
    if (!this.__hasAddedPropHandling) {
      addPropHandling(this)
      this.__hasAddedPropHandling = true
    }

    if (!ignoreAttributeChange) {
      const { propName, mapAttrToProp } = propConfigByAttrName.get(
        attrName
      ) as any

      if (typeof value === 'string') {
        this[propName] = mapAttrToProp(value)
      }
    }
  }
}

function addPropHandling(obj: any) {
  const clazz = obj.constructor
  const ctrl: Ctrl = obj.__ctrl
  const propConfigs = Array.from(elemConfigByClass.get(clazz)!.props.values())

  propConfigs.forEach((propConfig) => {
    const { propName, hasAttr } = propConfig

    let propValue = obj[propName]

    Object.defineProperty(obj, propName, {
      get() {
        return propValue
      },

      set(value: any) {
        propValue = value

        if (propConfig.hasAttr && propConfig.reflect) {
          try {
            ignoreAttributeChange = true

            obj.setAttribute(
              propConfig.attrName,
              propConfig.mapPropToAttr(value)
            )
          } finally {
            ignoreAttributeChange = false
          }
        }

        ctrl.refresh()
      }
    })
  })
}

// === Attrs =========================================================

const Attrs = {
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

// === tools =========================================================

function propNameToAttrName(propName: string) {
  return propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

function createNotifier() {
  const subscribers: (() => void)[] = []

  return {
    subscribe: (subscriber: () => void) => void subscribers.push(subscriber),
    notify: () => void (subscribers.length && subscribers.forEach((it) => it()))
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

// === utils ================================================

function definePropValue(obj: object, propName: string, value: any) {
  Object.defineProperty(obj, propName, { value })
}

function registerElement(
  tagName: string,
  elementClass: CustomElementConstructor
): void {
  // TODO!!!!
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

// === context =======================================================

function createCtx<T>(defaultValue?: T): Context<T> {
  return Object.freeze({
    kind: 'context',
    defaultValue: defaultValue!
  })
}

function defineProvider<T>(
  tagName: string,
  ctx: Context<T>
): { new (): HTMLElement & { value: T | undefined } } {
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

  return CtxProviderElement
}
