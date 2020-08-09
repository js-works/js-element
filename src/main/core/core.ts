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

import { PropNameManager } from './PropNameManager'
import { createNotifier, isEqualArray } from './utils'
import { checkComponentConfig, isValidTagName } from './validation'

// === exports =======================================================

export { createAdaption }

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

  const propNameMgr = new PropNameManager(
    propNames.reduce((acc: Map<string, boolean>, propName) => {
      const type = config.props[propName].type
      const alsoAsAttribute =
        type &&
        type !== Object &&
        type !== Array &&
        (propName.substr(0, 2) !== 'on' ||
          propName[3] < 'A' ||
          propName[3] > 'Z')

      acc.set(propName, alsoAsAttribute)
      return acc
    }, new Map())
  )

  const ctxKeys = config.ctx ? Object.keys(config.ctx) : []
  const observedAttributes = Array.from(propNameMgr.getAttributNames())

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

      for (const propName of propNameMgr.getEventPropNames()) {
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
      const normalizedPropName = propNameMgr.attrNameToPropName(
        attrName.toLocaleLowerCase()
      )

      if (normalizedPropName) {
        this._propsObject[normalizedPropName] = value
      }

      this._refresh()
    }

    addEventListener(this: any, eventName: string, callback: any) {
      if (propNameMgr.getEventNames().has(eventName)) {
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

        if (propNameMgr.isEventPropName(propName)) {
          const eventName = propNameMgr.eventPropNameToEventName(propName)

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
