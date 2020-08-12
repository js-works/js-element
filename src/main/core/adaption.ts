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
  Renderer,
  VNode
} from './types'

import { createNotifier } from './notifiers'
import { PropNamesManager } from './prop-names'
import { isEqualArray } from './utils'
import { checkComponentOptions, isValidTagName } from './validation'

// === exports =======================================================

export { createAdaption }

// === constants =====================================================

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// === createAdaption ================================================

function createAdaption<O, R>(
  renderer: (content: O, target: Element) => void
): FunctionDefineElement<O, R> {
  return (name: string, options: any, init: any) =>
    defineElementWithRenderer(name, options, init, renderer) as any // TODO
}

// === defineElementWithRenderer =====================================

function defineElementWithRenderer(
  name: string,
  options: any,
  init: (c: Ctrl, props: any) => () => VNode,
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

    try {
      checkComponentOptions(options)
    } catch (errorMsg) {
      throw new TypeError(
        `Invalid options for custom element "${name}": ${errorMsg}`
      )
    }
  }

  const CustomElement = createCustomElementClass(name, options, init, renderer)
  customElements.define(name, CustomElement)
}

// === BaseElement ===================================================

const createCustomElementClass = (
  name: string,
  options: any,
  init: any,
  renderer: Renderer
) => {
  const propNames = options && options.props ? Object.keys(options.props) : []

  const propNamesMgr = new PropNamesManager(
    !options || !options.props
      ? null
      : propNames.reduce((acc: Map<string, boolean>, propName) => {
          const type = options.props[propName].type
          const alsoAsAttribute =
            type &&
            type !== Object &&
            type !== Array &&
            (propName[0] !== 'o' ||
              propName[1] !== 'n' ||
              propName[2] < 'A' ||
              propName[2] > 'Z')

          acc.set(propName, alsoAsAttribute)
          return acc
        }, new Map())
  )

  const observedAttributes = Array.from(propNamesMgr.getAttributNames())

  const customElementClass = class extends HTMLElement {
    private _ctrl: Ctrl
    private _contentElem: Element | null = null
    private _render?: () => any
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

      for (const propName of propNamesMgr.getPropNames()) {
        const isEventProp = propNamesMgr.isEventPropName(propName)
        const eventName = isEventProp
          ? propNamesMgr.eventPropNameToEventName(propName)
          : null

        Object.defineProperty(this, propName, {
          get() {
            this._propsObject[propName]
          },

          set(value: any) {
            if (isEventProp) {
              const oldValue = this._propsObject[propName]

              if (typeof oldValue === 'function') {
                this.removeEventListener(eventName, oldValue)
              }

              if (typeof value === 'function') {
                this.addEventListener(eventName, value)
              }
            }

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

      if (!this._render) {
        this._render = init(this._ctrl, this._propsObject)
      }

      const content = this._render!()
      renderer(content, this._contentElem!)
      this._initialized = true

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

      if (options && options.styles) {
        const styles = options.styles

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
      const normalizedPropName = propNamesMgr.attrNameToPropName(
        attrName.toLocaleLowerCase()
      )

      if (normalizedPropName) {
        this._propsObject[normalizedPropName] = value
      }

      this._refresh()
    }

    addEventListener(this: any, eventName: string, callback: any) {
      if (propNamesMgr.getEventNames().has(eventName)) {
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
        ret[propName] = options.props[propName].defaultValue

        if (propNamesMgr.isEventPropName(propName)) {
          const eventName = propNamesMgr.eventPropNameToEventName(propName)

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

  if (options && options.methods && options.methods.length > 0) {
    options.methods.forEach((methodName: any) => {
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
