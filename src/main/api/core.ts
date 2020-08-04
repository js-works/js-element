import { html, render, TemplateResult } from 'lit-html'

import {
  Action,
  AnyElement,
  Ctrl,
  Message,
  Methods,
  State,
  StateUpdater
} from '../internal/types'

// === exports =======================================================

export { defineElement, html, propConfigBuilder as prop }

// === constants =====================================================

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// === types =========================================================

type Class<T> = {
  new (...arg: any[]): T
}

type Content = TemplateResult

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
  default?: T
}

type PropsConfig = {
  [key: string]: PropConfig<any>
}

type CtxConfig = Record<string, (c: Ctrl) => any>

type ConfigStateful<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC | ((propBuilder: typeof propConfigBuilder) => PC)
  ctx?: CC
  styles?: string | (() => string)
  slots?: string[]
  methods?: string[]
  init(c: Ctrl, props: InternalPropsOf<PC>, ctx: CtxOf<CC>): () => Content
}

type ConfigStateless<PC extends PropsConfig, CC extends CtxConfig> = {
  props?: PC
  ctx?: CC
  styles?: string | string[] | (() => string) | (() => string[])
  slots?: string[]
  render(props: InternalPropsOf<PC>, ctx: CtxOf<CC>): Content
}

type ExternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]?: PropOf<P[K]> },
  { [K in keyof P]: P[K] extends { required: true } ? never : K }[keyof P]
> &
  Pick<
    { [K in keyof P]: PropOf<P[K]> },
    { [K in keyof P]: P[K] extends { required: true } ? K : never }[keyof P]
  >

type InternalPropsOf<P extends PropsConfig> = Pick<
  { [K in keyof P]: PropOf<P[K]> },
  {
    [K in keyof P]: P[K] extends { default: any }
      ? K
      : P[K] extends { required: true }
      ? K
      : never
  }[keyof P]
> &
  Pick<
    { [K in keyof P]?: PropOf<P[K]> },
    {
      [K in keyof P]: P[K] extends { default: any }
        ? never
        : P[K] extends { required: true }
        ? never
        : K
    }[keyof P]
  >

type PropOf<P extends PropConfig<any>> = P extends { type: infer T }
  ?
      | (T extends BooleanConstructor
          ? boolean
          : T extends NumberConstructor
          ? number
          : T extends StringConstructor
          ? string
          : T extends ArrayConstructor
          ? any[]
          : T extends DateConstructor
          ? Date
          : any)
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

function defineElement(name: string, init: (c: Ctrl) => () => Content): void
function defineElement(name: string, render: () => Content): void

function defineElement<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,
  config: ConfigStateful<PC, CC>
): void

function defineElement<PC extends PropsConfig, CC extends CtxConfig>(
  name: string,
  config: ConfigStateless<PC, CC>
): void

function defineElement(name: string, config: any): void {
  if (typeof config === 'function') {
    config = config.length === 0 ? { render: config } : { init: config }
  }

  const CustomElement = createCustomElementClass(config.name, config)
  customElements.define(name, CustomElement)
}

// === BaseElement ===================================================

const createCustomElementClass = (name: string, config: any) => {
  const propNames = config.props ? Object.keys(config.props) : []
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
    private _render?: () => TemplateResult
    private _methods?: Methods
    private _initialized = false
    private _mounted = false
    private _propsObject = this._createPropsObject()
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

      this._ctrl = {
        getName() {
          return name
        },

        getElement(): Element {
          return self
        },

        getRoot(): Element {
          return self._contentElem!
        },

        isInitialized(): boolean {
          return self._initialized
        },

        isMounted(): boolean {
          return self._mounted
        },

        refresh(): void {
          self._refresh()
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

        addState<S extends State>(initialState: S): [S, StateUpdater<S>] {
          let nextState: any, // TODO
            mergeNecessary = false

          const state = { ...initialState }

          const setState = (arg1: any, arg2: any) => {
            mergeNecessary = true

            if (typeof arg1 === 'string') {
              nextState[arg1] =
                typeof arg2 === 'function' ? arg2(nextState[arg1]) : arg2
            } else if (typeof arg1 === 'function') {
              Object.assign(nextState, arg1(nextState))
            } else {
              Object.assign(nextState, arg1)
            }

            this.onceBeforeUpdate(() => {
              if (mergeNecessary) {
                mergeNecessary = false
                Object.assign(state, nextState)
              }
            })

            this.refresh()
          }

          nextState = { ...state }

          return [state, setState as any] // TODO
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
          return this.getRoot().querySelector(selector)
        },

        findAll<T extends Element = AnyElement>(selector: string) {
          return this.getRoot().querySelectorAll<T>(selector)
        },

        send(msg: Message) {
          const root = this.getRoot()

          root.dispatchEvent(
            new CustomEvent(MESSAGE_EVENT_TYPE, {
              bubbles: true,
              detail: msg
            })
          )
        },

        receive(handler: (msg: Message) => void): () => void {
          const root = this.getRoot(),
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

      if (!this._render) {
        if (config.render) {
          this._render = () => config.render(this._propsObject)
        } else {
          this._render = config.init(this._ctrl, this._propsObject)
        }

        this._initialized = true
      }

      const content = this._render!()
      render(content, this._contentElem!)

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
        const styles: any =
          config.styles === 'function' ? config.styles() : config.styles

        const css =
          typeof styles === 'string'
            ? styles
            : styles.join('\n\n/* =============== */\n\n')

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
      this._ctrl.getRoot().innerHTML = ''
    }

    _createPropsObject() {
      const ret = {} as any

      for (const propName of propNames) {
        ret[propName] = config.props[propName].default

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

// === defineProvision ===============================================

type ProvisionSubscriber<T> = {
  notifyChange(newValue: T): void
}

let counter = 0

function getNewEventType(): string {
  return `$$provision$$_${++counter}`
}

export function defineProvision<T>(
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
      c.getRoot().addEventListener(subscribeEventType, onSubscribe)

      c.beforeUnmount(() => {
        c.getRoot().removeEventListener(subscribeEventType, onSubscribe)
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

// === StoreProvider =================================================

defineElement('store-provider', {
  props: {
    store: {
      type: Object,
      required: true
    }
  },

  init(c, props) {
    let key = 0

    c.effect(
      () => {
        const unsubscribe1 = c.receive((msg) => {
          props.store.dispatch(msg)
        })

        const unsubscribe2 = props.store.subscribe(() => {
          c.refresh()
        })

        return () => {
          unsubscribe1()
          unsubscribe2()
        }
      },
      () => [props.store]
    )

    return () => html`<slot></slot>`
  }
})

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
  }),
  typedProp = <T extends Class<any>>(type: T) => ({
    nul: reqAndOpt(type, true),
    ...reqAndOpt(type, false)
  }),
  propConfig = <T>(
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
        ret.default = defaultValue
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
