import { html, render as renderLit, TemplateResult } from '../internal/lit-html'
import { h as createElement, patch, isElement } from '../internal/superfine'

import { Action, AnyElement, Ctrl, Message, Methods } from '../internal/types'

// === exports =======================================================

export {
  defineElement,
  provision,
  component,
  h,
  html,
  propConfigBuilder as prop,
  render,
  VElement,
  VNode
}

// === constants =====================================================

// --- general constants ---

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// --- constants for component configuration validation ---

const ALLOWED_PROPERTY_TYPES = new Set([
  Boolean,
  Number,
  String,
  Object,
  Function,
  Array,
  Date
])

const REGEX_TAG_NAME = /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/
const REGEX_PROP_NAME = /^[a-z][a-zA-Z0-9]*$/
const REGEX_METHOD_NAME = /^[a-z][a-z0-9]*$/
const REGEX_SLOT_NAME = /^[a-z][a-z0-9]*$/
const REGEX_CTX_KEY = /^[a-z][a-z0-9]*$/

// === types =========================================================

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

type Class<T> = {
  new (...arg: any[]): T
}

type Renderer = (content: any, target: Element) => void

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

type PropConfig<T> = {
  type?: T extends boolean
    ? BooleanConstructor
    : T extends number
    ? NumberConstructor
    : T extends string
    ? StringConstructor
    : T extends object
    ? ObjectConstructor
    : T extends Function
    ? FunctionConstructor
    : T extends undefined
    ? any
    : never

  nullable?: boolean
  required?: boolean
  defaultValue?: T
}

type PropsConfig = {
  [key: string]: PropConfig<any>
}

type CtxConfig = Record<string, (c: Ctrl) => any>

type ConfigStateful1LitHtml<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | (() => string)
  slots?: string[]
  methods?: string[]
  main(
    c: Ctrl,
    props: InternalPropsOf<PC>,
    ctx: CtxOf<CC>
  ): () => TemplateResult
}

type ConfigStateful2LitHtml<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | (() => string)
  slots?: string[]
  methods?: string[]
  view(
    c: Ctrl,
    getProps: () => InternalPropsOf<PC>,
    getCtx: () => CtxOf<CC>
  ): () => TemplateResult
}

type ConfigStatelessLitHtml<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | string[]
  slots?: string[]
  render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): TemplateResult
}

type ConfigStateful1Superfine<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | (() => string)
  slots?: string[]
  methods?: string[]
  main(c: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => any // TODO
}

type ConfigStateful2Superfine<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | (() => string)
  slots?: string[]
  methods?: string[]
  view(
    c: Ctrl,
    getProps: () => InternalPropsOf<PC>,
    getCtx: () => CtxOf<CC>
  ): () => any // TODO
}

type ConfigStatelessSuperfine<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | string[]
  slots?: string[]
  render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): any
}

type ExternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]?: PropOf<P[K]> },
  { [K in keyof P]: P[K] extends { required: true } ? never : K }[keyof P]
> &
  Pick<
    { [K in keyof P]: PropOf<P[K]> },
    { [K in keyof P]: P[K] extends { required: true } ? K : never }[keyof P]
  >

type InternalPropsOf<PC extends PropsConfig> = Pick<
  { [K in keyof PC]: PropOf<PC[K]> },
  {
    [K in keyof PC]: PC[K] extends { defaultValue: any }
      ? K
      : PC[K] extends { required: true }
      ? K
      : never
  }[keyof PC]
> &
  Pick<
    { [K in keyof PC]?: PropOf<PC[K]> },
    {
      [K in keyof PC]: PC[K] extends { defaultValue: any }
        ? never
        : PC[K] extends { required: true }
        ? never
        : K
    }[keyof PC]
  >

type PropOf<P extends PropConfig<any>> = P extends { type: infer T }
  ?
      | (T extends Boolean
          ? boolean
          : T extends Number
          ? number
          : T extends String // ? string // : T extends Array
          ? any[]
          : T extends Date
          ? Date
          : never)
      | (P extends { nullable: true } ? null : never)
  : never

type CtxOf<CC extends CtxConfig> = {
  [K in keyof CC]: ReturnType<CC[K]>
}
/*
type CtxTypeOf<C extends CtxConfig> = C extends (
  c: Ctrl
) => Record<infer K, () => infer R>
  ? Record<K, R>
  : C extends Record<infer K, () => infer R>
  ? Record<K, R>
  : never
*/

type FunctionDefineElementLitHtml = {
  (name: string, main: (c: Ctrl) => () => TemplateResult): void
  (name: string, render: () => TemplateResult): void

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStateful1LitHtml<PC, CC>
  ): void

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStateful2LitHtml<PC, CC>
  ): void

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStatelessLitHtml<PC, CC>
  ): void
}

type FunctionDefineElementSuperfine = {
  (name: string, main: (c: Ctrl) => () => any): Component<any>
  (name: string, render: () => any): Component<any>

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStateful1Superfine<PC, CC>
  ): Component<any>

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStateful2Superfine<PC, CC>
  ): Component<any>

  <PC extends PropsConfig, CC extends CtxConfig>(
    name: string,
    config: ConfigStatelessSuperfine<PC, CC>
  ): Component<any>
}

// === defineElement =================================================

const defineElement: FunctionDefineElementLitHtml = (
  name: string,
  config: any
) => defineElementWithRenderer(name, config, renderLit)

// === component ======================================================

function superfineRenderer(content: any, target: Element) {
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

const component: FunctionDefineElementSuperfine = (
  name: string,
  config: any
) => {
  defineElementWithRenderer(name, config, superfineRenderer)

  const ret = h.bind(null, name)

  Object.defineProperty(ret, 'js-elements:type', {
    value: name
  })

  return ret
}

// === defineElementWithRenderer =====================================

function defineElementWithRenderer(
  name: string,
  config: any,
  renderer: any
): void {
  if (process.env.NODE_ENV === ('development' as any)) {
    if (typeof name !== 'string') {
      throw new TypeError(
        'First argument for function "defineElement" must be a string'
      )
    } else if (!name.match(REGEX_TAG_NAME)) {
      throw new Error(`Illegal tag name for custom element: "${name}"`)
    }

    if (typeof config !== 'function') {
      try {
        checkComponentConfig(config)
      } catch (errorMsg) {
        throw new TypeError(
          `Invalid configuration for custom element "${name}": ${errorMsg}`
        )
      }
    }
  }

  if (typeof config === 'function') {
    const fn = config

    if (config.length > 0) {
      config = { main: fn }
    } else {
      config = {
        main: () => {
          let ret = fn()

          if (typeof ret !== 'function') {
            ret = fn
          }

          return ret
        }
      }
    }
  }

  const CustomElement = createCustomElementClass(config.name, config, renderer)
  customElements.define(name, CustomElement)
}

// === BaseElement ===================================================

const createCustomElementClass = (
  name: string,
  config: any,
  renderer: Renderer
) => {
  const propNames = config.props ? Object.keys(config.props) : []
  const ctxKeys = config.ctx ? Object.keys(config.ctx) : []
  const eventPropNames = propNames.filter(isEventPropName)

  const eventNames = new Set(
    eventPropNames.map((it) => eventPropNameToEventName(it))
  )

  const attrNameToPropNameMap = new Map<string, string>()

  for (const propName of propNames) {
    if (!isEventPropName(propName)) {
      attrNameToPropNameMap.set(propNameToAttrName(propName), propName)
    }
  }

  const observedAttributes = propNames
    .filter((propName) => {
      const type = config.props[propName].type

      return (
        type &&
        type !== Object &&
        type !== Array &&
        type !== Date &&
        !isEventPropName(propName)
      )
    })
    .map(propNameToAttrName)

  const customElementClass = class extends HTMLElement {
    private _ctrl: Ctrl
    private _contentElem: Element | null = null
    private _render?: () => any
    private _methods?: Methods
    private _initialized = false
    private _mounted = false
    private _propsObject = this._createPropsObject()
    private _ctxObject = {} as any // TODO
    private _listenersByEventName?: any // TODO!!!!!!!
    private _afterMountNotifier?: Notifier
    private _afterUpdateNotifier?: Notifier
    private _beforeUpdateNotifier?: Notifier
    private _beforeUnmountNotifier?: Notifier
    private _onceBeforeUpdateActions?: Action[]

    static observedAttributes = observedAttributes

    constructor() {
      super()
      const self = this

      for (const propName of propNames.filter((it) => !isEventPropName(it))) {
        Object.defineProperty(this, propName, {
          get() {
            this._propsObject[propName]
          },

          set(value: any) {
            // TODO: Validation?
            this._propsObject[propName] = value
            this._ctrl.refresh()
          }
        })
      }

      this._ctrl = {
        getName() {
          return name
        },

        getElement(): Element {
          return self
        },

        getContentElement(): Element {
          return self._contentElem!
        },

        isInitialized(): boolean {
          return self._initialized
        },

        isMounted(): boolean {
          return self._mounted
        },

        refresh(): void {
          if (self._mounted) {
            self._refresh()
          }
        },

        update(action) {
          action()
          this.refresh()
        },

        updateFn<A extends any[]>(fn: (...args: A) => void) {
          return (...args: A) => {
            fn.apply(null, args)
            this.refresh()
          }
        },

        afterMount(action: Action): void {
          const notifier =
            self._afterMountNotifier ||
            (self._afterMountNotifier = createNotifier())

          notifier.subscribe(action)
        },

        afterUpdate(action: Action): void {
          const notifier =
            self._afterUpdateNotifier ||
            (self._afterUpdateNotifier = createNotifier())

          notifier.subscribe(action)
        },

        beforeUnmount(action: Action): void {
          const notifier =
            self._beforeUnmountNotifier ||
            (self._beforeUnmountNotifier = createNotifier())

          notifier.subscribe(action)
        },

        onceBeforeUpdate(action: Action): void {
          self._onceBeforeUpdateActions || (self._onceBeforeUpdateActions = [])
          self._onceBeforeUpdateActions.push(action)
        },

        effect(action: Action, getDeps?: null | (() => any[])) {
          let oldDeps: any[] | null = null,
            cleanup: Action | null | undefined | void

          if (getDeps === null) {
            this.afterMount(() => {
              cleanup = action()
            })

            this.beforeUnmount(() => {
              cleanup && cleanup()
            })
          } else if (getDeps === undefined || typeof getDeps === 'function') {
            const callback = () => {
              let needsAction = getDeps === undefined

              if (!needsAction) {
                const newDeps = getDeps!()

                needsAction =
                  oldDeps === null ||
                  newDeps === null ||
                  !isEqualArray(oldDeps, newDeps)
                oldDeps = newDeps
              }

              if (needsAction) {
                cleanup && cleanup()
                cleanup = action()
              }
            }

            this.afterMount(callback)
            this.afterUpdate(callback)
          } else {
            throw new TypeError(
              'Third argument of "effect" method must either be undefined, null or a function'
            )
          }
        },

        setMethods(methods: Methods) {
          self._methods = methods
        },

        find(selector: string) {
          return this.getContentElement().querySelector(selector)
        },

        findAll<T extends Element = AnyElement>(selector: string) {
          return this.getContentElement().querySelectorAll<T>(selector)
        },

        send(msg: Message) {
          const root = this.getContentElement()

          root.dispatchEvent(
            new CustomEvent(MESSAGE_EVENT_TYPE, {
              bubbles: true,
              detail: msg
            })
          )
        },

        receive(handler: (msg: Message) => void): () => void {
          const root = this.getContentElement(),
            listener = (ev: Event) => {
              handler((ev as any).detail)
            },
            unsubscribe = () => {
              root.removeEventListener(MESSAGE_EVENT_TYPE, listener)
            }

          root.addEventListener(MESSAGE_EVENT_TYPE, listener)
          this.beforeUnmount(unsubscribe)

          return unsubscribe
        }
      }
    }

    _refresh() {
      if (!this._contentElem) {
        return // TODO!!!!!!!!!!!!!!!!!!!!!
      }

      if (
        this._mounted &&
        this._onceBeforeUpdateActions &&
        this._onceBeforeUpdateActions.length
      ) {
        try {
          this._onceBeforeUpdateActions.forEach((action) => action())
          this._beforeUpdateNotifier && this._beforeUpdateNotifier.notify()
        } finally {
          this._onceBeforeUpdateActions.length = 0
        }
      }

      for (const ctxKey of ctxKeys) {
        this._ctxObject[ctxKey] = config.ctx[ctxKey](this._ctrl)
      }

      if (!this._render) {
        if (config.render) {
          this._render = () => config.render(this._propsObject, this._ctxObject)
        } else if (config.main) {
          this._render = config.main(
            this._ctrl,
            this._propsObject,
            this._ctxObject
          )
        } else {
          // TODO: This is ugly and buggy as hell - fix as soon as possible
          const getProps = () => ({ ...this._propsObject })
          const getCtx = () => ({ ...this._ctxObject })

          this._render = () => {
            const fn = config.view(this._ctrl, getProps, getCtx)

            return () => fn(getProps(), getCtx())
          }
        }

        this._initialized = true
      }

      const content = this._render!()
      renderer(content, this._contentElem!)

      if (!this._mounted) {
        this._mounted = true
        this._afterMountNotifier && this._afterMountNotifier.notify()
      } else {
        this._afterUpdateNotifier && this._afterUpdateNotifier.notify()
      }
    }

    connectedCallback() {
      this.attachShadow({ mode: 'open' })
      const root = this.shadowRoot!

      const stylesElem = document.createElement('span')
      const contentElem = document.createElement('span')

      stylesElem.setAttribute('data-role', 'styles')
      contentElem.setAttribute('data-role', 'content')

      root.appendChild(stylesElem)
      root.appendChild(contentElem)
      this._contentElem = contentElem

      if (config.styles) {
        const styles = config.styles

        const css = Array.isArray(styles)
          ? styles.join('\n\n/* =============== */\n\n')
          : styles

        const styleElem = document.createElement('style')
        styleElem.appendChild(document.createTextNode(css))
        stylesElem.appendChild(styleElem)
      }

      this._refresh()
    }

    attributeChangedCallback(attrName: string, _: any, value: any) {
      const normalizedPropName = attrNameToPropNameMap.get(
        attrName.toLocaleLowerCase()
      )

      if (normalizedPropName) {
        this._propsObject[normalizedPropName] = value
      }

      this._refresh()
    }

    addEventListener(this: any, eventName: string, callback: any) {
      if (eventNames.has(eventName)) {
        this._listenersByEventName = this._listenersByEventName || {}

        this._listenersByEventName[eventName] =
          this._listenersByEventName[eventName] || new Set()

        this._listenersByEventName[eventName].add(callback)
      }

      super.addEventListener.call(this, eventName, callback)
    }

    removeEventListener(this: any, eventName: string, callback: any) {
      // TODO
      if (!this._listenersByEventName[eventName]) {
        HTMLElement.prototype.removeEventListener.call(
          this,
          eventName,
          callback
        )
        return
      }

      this._listenersByEventName[eventName].remove(callback)
      HTMLElement.prototype.removeEventListener.call(this, eventName, callback)
    }

    disconnectedCallback() {
      this._beforeUnmountNotifier && this._beforeUnmountNotifier.notify()
      this._ctrl.getContentElement().innerHTML = ''
    }

    _createPropsObject() {
      const ret = {} as any

      for (const propName of propNames) {
        ret[propName] = config.props[propName].defaultValue

        if (isEventPropName(propName)) {
          const eventName = eventPropNameToEventName(propName)

          Object.defineProperty(ret, propName, {
            get() {
              const listenerSet =
                this._listenersByEventName &&
                this._listenersByEventName[eventName]

              return !listenerSet || listenerSet.size === 0
                ? undefined
                : (ev: any) => this.dispatchEvent(ev)
            }
          })
        }
      }

      return ret
    }
  }
  if (config.methods && config.methods.length > 0) {
    config.methods.forEach((methodName: any) => {
      // TODO
      ;(customElementClass as any).prototype[methodName] = function () {
        // TODO
        const fn = this._methods && this._methods[methodName]

        if (!fn) {
          throw new Error(
            `Handler for method "${methodName}" of component "${name}" has not been set`
          )
        }

        return fn.apply(null, arguments)
      }
    })
  }

  return customElementClass
}

// === provision =====================================================

type ProvisionSubscriber<T> = {
  notifyChange(newValue: T): void
}

let counter = 0

function getNewEventType(): string {
  return `$$provision$$_${++counter}`
}

function provision<T>(
  name: string,
  defaultValue: T
): [(c: Ctrl, value: T) => void, (c: Ctrl) => T] {
  const subscribeEventType = getNewEventType()
  const providersMap = new Map<Ctrl, [T, Set<ProvisionSubscriber<any>>]>()
  const consumersMap = new Map<Ctrl, () => T>()

  const provideProvision = (c: Ctrl, value: T) => {
    if (!providersMap.has(c)) {
      if (c.isMounted()) {
        throw new Error(
          'First invocation of provision provider function must be performed before first component rendering'
        )
      }

      const onSubscribe = (ev: any) => {
        ev.stopPropagation()
        const subscriber = ev.detail
        const [value, subscribers] = providersMap.get(c)!

        subscribers.add(subscriber)

        subscriber.cancelled.then(() => {
          subscribers.delete(subscriber)
        })

        subscriber.notifyChange(value)
      }

      providersMap.set(c, [value, new Set()])
      c.getContentElement().addEventListener(subscribeEventType, onSubscribe)

      c.beforeUnmount(() => {
        c.getContentElement().removeEventListener(
          subscribeEventType,
          onSubscribe
        )
        providersMap.delete(c)
      })
    } else {
      const data = providersMap.get(c)!

      if (value !== data[0]) {
        data[0] = value

        data[1].forEach((subscriber) => {
          subscriber.notifyChange(value)
        })
      }
    }
  }

  const consumeProvision = function (c: Ctrl) {
    let currentValue: T
    let getter = consumersMap.get(c)

    if (!getter) {
      if (c.isMounted()) {
        throw new Error(
          'First invocation of provision consumer function must be performed before first component rendering'
        )
      }

      getter = () => (currentValue !== undefined ? currentValue : defaultValue)
      consumersMap.set(c, getter)

      let cancel: any = null // will be set below // TODO

      c.beforeUnmount(() => cancel && cancel())

      c.getElement().dispatchEvent(
        new CustomEvent(subscribeEventType, {
          bubbles: true,
          detail: {
            notifyChange(newValue) {
              currentValue = newValue
              c.refresh() // TODO: optimize
            },

            cancelled: new Promise((resolve) => {
              cancel = resolve
            })
          } as ProvisionSubscriber<T>
        })
      )
    }

    return getter()
  }

  return [provideProvision, consumeProvision]
}

/*
// === StoreProvider =================================================

defineElement('store-provider', {
  props: {
    store: {
      required: true
    }
  },

  main(c, props) {
    let key = 0

    c.effect(
      () => {
        const unsubscribe1 = c.receive((msg: Message) => {
          ;(props.store as any).dispatch(msg) // TODO
        })

        // TODO
        const unsubscribe2 = (props.store as any).subscribe(() => {
          c.refresh()
        })

        return () => {
          unsubscribe1()
          unsubscribe2()
        }
      },
      () => [props.store]
    )

    return html`<slot></slot>`
  }
})
*/
// === createNotifier ================================================

function createNotifier(): Notifier {
  const subscribers: (() => void)[] = []

  return {
    subscribe(subscriber: () => void) {
      subscribers.push(subscriber)
    },

    notify() {
      subscribers.forEach((subscriber) => subscriber())
    }
  }
}

// === helpers =======================================================

function hasOwnProp(obj: object, propName: string) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

function isEqualArray(arr1: any[], arr2: any[]) {
  let ret =
    Array.isArray(arr1) && Array.isArray(arr2) && arr1.length === arr2.length

  if (ret) {
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        ret = false
        break
      }
    }
  }

  return ret
}

function isEventPropName(name: string) {
  return name.match(/^on[A-Z][a-z0-9]*/)
}

function eventPropNameToEventName(eventPropName: string) {
  return eventPropName[2].toLowerCase() + eventPropName.substr(3)
}

function propNameToAttrName(propName: string) {
  return propName
    .replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// === propConfigBuilder =============================================

type F<C, T> = Readonly<{
  nul: Readonly<{
    req(): { type: C; nullable: true; required: true }

    opt: {
      (): { type: C; nullable: true }
      (defaultValue: T): { type: C; nullable: true; defaultValue: T }
    }
  }>

  req(): { type: C; required: true }

  opt: {
    (): { type: T }
    (defaultValue: T): { type: C; defaultValue: T }
  }
}>

type G = Readonly<{
  bool: F<Boolean, boolean>
  num: F<Number, number>
  str: F<String, string>
  obj: F<Object, object>
  func: F<Function, (...args: any[]) => any>

  req(): { required: true }

  opt: {
    (): {}
    (defaultValue: any): { defaultValue: any }
  }
}>

const reqAndOpt = <T>(
  type: PropConfig<any>['type'] | null,
  nullable: boolean
) => ({
  req: () => propConfig(type, nullable, true, undefined, false),

  opt: (defaultValue?: T, isGetter: boolean = false) =>
    propConfig(type, nullable, false, defaultValue, isGetter)
})

const typedProp = <T extends Class<any>>(type: T) => ({
  nul: reqAndOpt(type, true),
  ...reqAndOpt(type, false)
})

const propConfig = <T>(
  type: PropConfig<any>['type'],

  //  | BooleanConstructor
  //  | NumberConstructor
  //  | StringConstructor
  //  | ObjectConstructor
  //  | FunctionConstructor,
  // | ArrayConstructor
  // | DateConstructor,
  nullable: boolean,
  required: boolean,
  defaultValue: T | undefined,
  defaultValueIsGetter: boolean
): PropConfig<T> => {
  const ret: PropConfig<T> = {}

  type && (ret.type = type)
  nullable && (ret.nullable = true)
  required && (ret.required = true)

  if (defaultValue !== undefined) {
    if (defaultValueIsGetter && typeof defaultValue === 'function') {
      Object.defineProperty(ret, 'defaultValue', {
        get: defaultValue as any // TODO
      })
    } else {
      ret.defaultValue = defaultValue
    }
  }

  return Object.freeze(ret)
}

const propConfigBuilder = (Object.freeze({
  bool: typedProp(Boolean),
  num: typedProp(Number),
  str: typedProp(String),
  obj: typedProp(Object),
  func: typedProp(Function),
  ...reqAndOpt(null, false)
}) as any) as G

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

// === component configuration validation ============================

function checkComponentConfig(config: any) {
  if (config === undefined) {
    return
  }

  if (!config || typeof config !== 'object') {
    throw 'Component configuration must be an object'
  }

  if (
    Number(hasOwnProp(config, 'render')) +
      Number(hasOwnProp(config, 'main')) +
      Number(hasOwnProp(config, 'view')) >
    1
  ) {
    throw 'Component configuration can only have one of the parameters "render", "main" or "view"'
  }

  const checkParam = (key: string, pred: (it: any) => boolean) => {
    if (!pred(config[key])) {
      throw `Invalid option parameter "${key}"`
    }
  }

  for (const key of Object.keys(config)) {
    switch (key) {
      case 'props': {
        const propNames = Object.keys(config.props)

        for (const propName of propNames) {
          checkPropConfig(propName, config.props[propName])
        }

        break
      }

      case 'ctx': {
        checkCtxConfig(config.ctx)
        break
      }

      case 'methods':
        checkParam('methods', (it) =>
          validateStringArray(it, true, REGEX_METHOD_NAME)
        )
        break

      case 'styles':
        if (
          typeof Object.getOwnPropertyDescriptor(config, 'styles')?.get !==
          'function'
        ) {
          checkParam('styles', validateStringOrStringArray)
        }

        break

      case 'slots':
        checkParam('slots', (it) =>
          validateStringArray(it, true, REGEX_SLOT_NAME)
        )
        break

      case 'render':
        checkParam('render', validateFunction)
        break

      case 'main':
        checkParam('main', validateFunction)
        break

      case 'view':
        checkParam('view', validateFunction)
        break

      default:
        throw new TypeError(`Illegal parameter "${key}"`)
    }
  }
}

function checkPropConfig(propName: string, propConfig: any) {
  // TODO
  if (!propName.match(REGEX_PROP_NAME)) {
    throw `Illegal prop name "${propName}"`
  }

  const type = propConfig.type

  if (hasOwnProp(propConfig, 'type') && !ALLOWED_PROPERTY_TYPES.has(type)) {
    throw `Illegal parameter "type" for property "${propName}"`
  }

  for (const key of Object.keys(propConfig)) {
    switch (key) {
      case 'type':
        // already checked
        break

      case 'nullable':
        if (typeof propConfig.nullable !== 'boolean') {
          throw `Illegal parameter "nullable" for property "${propName}"`
        }
        break

      case 'required':
        if (typeof propConfig.required !== 'boolean') {
          throw `Illegal parameter "required" for property ${propName}`
        }
        break

      case 'defaultValue': {
        const defaultValue = propConfig.defaultValue
        const typeOfDefault = typeof defaultValue

        if (
          type &&
          !(defaultValue === null && propConfig.nullable) &&
          ((type === Boolean && typeOfDefault !== 'boolean') ||
            (type === Number && typeOfDefault !== 'number') ||
            (type === String && typeOfDefault !== 'string') ||
            (type === Object && typeOfDefault !== 'object') ||
            (type === Function && typeOfDefault !== 'function') ||
            (type === Array && !(defaultValue instanceof Array)) ||
            (type === Date && !(defaultValue instanceof Date)))
        ) {
          // TODO!!!
          throw `Illegal parameter "defaultValue" for property ${propName}`
        }
        break
      }

      default:
        throw `Illegal parameter "${key}" for prop "${propName}"`
    }
  }
}

function checkCtxConfig(ctxConfig: any) {
  if (!ctxConfig || typeof ctxConfig !== 'object') {
    throw 'Component config parameter "ctx" must be an object'
  }

  const ctxKeys = Object.keys(ctxConfig)

  for (const ctxKey of ctxKeys) {
    if (!ctxKey.match(REGEX_CTX_KEY)) {
      throw `Illegal component context key "${ctxKey}"`
    }

    if (typeof ctxConfig[ctxKey] !== 'function') {
      throw `Parameter "${ctxKey}" of "ctx" object must be a function`
    }
  }
}

function validateFunction(fn: any) {
  return typeof fn === 'function'
}

function validateStringOrStringArray(subj: any) {
  return typeof subj === 'string' || validateStringArray(subj)
}

function validateStringArray(arr: any, unique = false, regex?: RegExp) {
  const alreadyUsedValues: any = {} // TODO

  if (!Array.isArray(arr)) {
    return false
  }

  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i]

    if (typeof value !== 'string' || (regex && !value.match(regex))) {
      return false
    }

    if (unique) {
      if (hasOwnProp(alreadyUsedValues, value)) {
        return false
      }

      alreadyUsedValues[value] = true
    }
  }

  return true
}
