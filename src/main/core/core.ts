import {
  Action,
  AnyElement,
  Class,
  Ctrl,
  FunctionDefineElement,
  Message,
  Methods,
  Notifier,
  PropConfig,
  Renderer
} from './types'

import { isEqualArray } from './utils'
import { checkComponentConfig, isValidTagName } from './validation'

// === exports =======================================================

export { createAdaption, provision, propConfigBuilder as prop }

// === constants =====================================================

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// === createAdaption ================================================

function createAdaption<O, R>(
  renderer: (content: O, target: Element) => void
): FunctionDefineElement<O, R> {
  return (name: string, config: any) =>
    defineElementWithRenderer(name, config, renderer) as any // TODO
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
    } else if (!isValidTagName(name)) {
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
          const fn = config.view(this._ctrl, getProps, getCtx)

          this._render = () => {
            let ret = fn(getProps(), getCtx())
            return ret
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
