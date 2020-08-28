import { createBaseElementClass } from './createBaseElementClass'
import { createNotifier } from './createNotifier'
import { getOwnProp, isEqualArray } from './utils'

import {
  Action,
  AnyElement,
  Ctrl,
  Message,
  Methods,
  Notifier,
  Props,
  PropsConfig,
  Renderer,
  VNode
} from './types'

// === constants =====================================================

const MESSAGE_TYPE_SUFFIX = '$$js-elements$$::'

// === creatCustomElementClass =======================================

export function createCustomElementClass(
  name: string,
  propsConfig: PropsConfig | null,
  methods: string[] | null,
  init: (c: Ctrl, props: Props) => () => VNode,
  renderer: Renderer
) {
  const propNames = propsConfig ? Object.keys(propsConfig) : []
  const defaultProps: Props = {}

  for (const propName of propNames) {
    defaultProps[propName] = (propsConfig![propName] as any).defaultValue // TODO!!!!!!!!!!!! : ''
  }

  return class extends createBaseElementClass(name, propsConfig, methods) {
    _props: Props = { ...defaultProps }
    _ctrl: Ctrl = this._createCtrl()
    _contentElement: Element | null = null // TODO
    _stylesElement: Element | null = null // TODO
    _render: null | (() => VNode) = null
    _initialized = false
    _mounted = false
    _refreshRequested = false
    _methods: Methods = {} // TODO
    _afterMountNotifier?: Notifier
    _beforeUpdateNotifier?: Notifier
    _afterUpdateNotifier?: Notifier
    _beforeUnmountNotifier?: Notifier
    _onceBeforeUpdateActions?: Action[]

    constructor() {
      super(
        (propName: string, value: any) => (this._props[propName] = value),
        (contentElement: Element) => (this._contentElement = contentElement),
        (stylesElement: Element) => (this._stylesElement = stylesElement),
        () => this._mounted && this._refresh(),
        (methodName: string) => getOwnProp(this._methods, methodName) || null
      )
    }

    connectedCallback() {
      super.connectedCallback()
      this._refresh()
    }

    disconnectedCallback() {
      this._beforeUnmountNotifier && this._beforeUnmountNotifier.notify()
      this._contentElement!.innerHTML = ''
    }

    _refresh() {
      if (this._mounted) {
        if (
          this._onceBeforeUpdateActions &&
          this._onceBeforeUpdateActions.length
        ) {
          try {
            this._onceBeforeUpdateActions.forEach((action) => action())
          } finally {
            this._onceBeforeUpdateActions.length = 0
          }
        }

        this._beforeUpdateNotifier && this._beforeUpdateNotifier.notify()
      }

      if (!this._render) {
        this._render = init(this._ctrl, this._props)
      }

      const content = this._render!()
      renderer(content, this._contentElement!)
      this._initialized = true

      if (!this._mounted) {
        this._mounted = true
        this._afterMountNotifier && this._afterMountNotifier.notify()
      } else {
        this._afterUpdateNotifier && this._afterUpdateNotifier.notify()
      }
    }

    _createCtrl(): Ctrl {
      let ctrl: Ctrl

      return (ctrl = {
        getName: () => name,
        isInitialized: () => this._initialized,
        isMounted: () => this._mounted,

        afterMount: (action: Action) => {
          this._afterMountNotifier ||
            (this._afterMountNotifier = createNotifier())
          this._afterMountNotifier.subscribe(action)
        },

        onceBeforeUpdate: (action: Action) => {
          this._onceBeforeUpdateActions || (this._onceBeforeUpdateActions = [])
          this._onceBeforeUpdateActions.push(action)
        },

        beforeUpdate: (action: Action) => {
          this._beforeUpdateNotifier ||
            (this._beforeUpdateNotifier = createNotifier())
          this._beforeUpdateNotifier.subscribe(action)
        },

        afterUpdate: (action: Action) => {
          this._afterUpdateNotifier ||
            (this._afterUpdateNotifier = createNotifier())
          this._afterUpdateNotifier.subscribe(action)
        },

        beforeUnmount: (action: Action) => {
          this._beforeUnmountNotifier ||
            (this._beforeUnmountNotifier = createNotifier())

          this._beforeUnmountNotifier.subscribe(action)
        },

        refresh: () => {
          if (!this._refreshRequested) {
            this._refreshRequested = true

            requestAnimationFrame(() => {
              this._refreshRequested = false
              this._refresh()
            })
          }
        },

        addStyles: (styles) => {
          const css = Array.isArray(styles)
            ? styles.join('\n\n/* =============== */\n\n')
            : styles

          const styleElem = document.createElement('style')
          styleElem.appendChild(document.createTextNode(css))
          this._stylesElement!.appendChild(styleElem)
        },

        update: (action: Action) => {
          action()
          this._refresh()
        },

        updateFn: <A extends any[]>(callback: (...args: A) => void) => {
          return (...args: A) => {
            callback(...args)
            this._refresh()
          }
        },

        effect: (action: Action, getDeps?: null | (() => any[])) => {
          let oldDeps: any[] | null = null,
            cleanup: Action | null | undefined | void

          if (getDeps === null) {
            ctrl.afterMount(() => {
              cleanup = action()
            })

            ctrl.beforeUnmount(() => {
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

            ctrl.afterMount(callback)
            ctrl.afterUpdate(callback)
            ctrl.beforeUnmount(() => cleanup && cleanup())
          } else {
            throw new TypeError(
              'Third argument of "effect" method must either be undefined, null or a function'
            )
          }
        },

        setMethods: (methods: Methods) => {
          this._methods = methods
        },

        find: (selector: string) => {
          return this._contentElement!.querySelector(selector)
        },

        findAll: <T extends Element = AnyElement>(selector: string) => {
          return this._contentElement!.querySelectorAll<T>(selector)
        },

        send: (msg: Message) => {
          const root = this

          root.dispatchEvent(
            new CustomEvent(MESSAGE_TYPE_SUFFIX + msg.type, {
              bubbles: true,
              composed: true,
              detail: msg
            })
          )
        },

        receive: (
          type: string,
          handler: (msg: Message) => void
        ): (() => void) => {
          const root = this._contentElement!

          const listener = (ev: Event) => {
            ev.stopPropagation()
            handler((ev as any).detail)
          }

          const unsubscribe = () => {
            root.removeEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
          }

          root.addEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
          ctrl.beforeUnmount(unsubscribe)

          return unsubscribe
        }
      })
    }
  }
}
