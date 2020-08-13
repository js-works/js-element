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

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// === creatCustomElementClass =======================================

export function createCustomElementClass(
  name: string,
  propsConfig: PropsConfig | null,
  styles: string | string[] | null,
  methods: string[] | null,
  init: (c: Ctrl, props: Props) => () => VNode,
  renderer: Renderer
) {
  const propNames = propsConfig ? Object.keys(propsConfig) : []
  const defaultProps: Props = {}

  for (const propName of propNames) {
    defaultProps[propName] = propsConfig![propName].defaultValue
  }

  return class extends createBaseElementClass(
    name,
    propsConfig,
    styles,
    methods
  ) {
    _props: Props = { ...defaultProps }
    _ctrl: Ctrl = this._createCtrl()
    _contentElement: Element | null = null // TODO
    _render: null | (() => VNode) = null
    _initialized = false
    _mounted = false
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
        () => this._refresh(),
        (methodName: string) => getOwnProp(this._methods, methodName) || null
      )
    }

    disconnectedCallback() {
      this._beforeUnmountNotifier && this._beforeUnmountNotifier.notify()
      this._ctrl.getContentElement().innerHTML = ''
    }

    _refresh() {
      if (!this._contentElement) {
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

    /* private */ _createCtrl(): Ctrl {
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

        refresh: () => this._refresh(),

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

        getElement: () => {
          return this
        },

        getContentElement: () => {
          return this._contentElement!
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
          } else {
            throw new TypeError(
              'Third argument of "effect" method must either be undefined, null or a function'
            )
          }
        },

        setMethods: (methods: Methods) => {
          this._methods = methods
        },

        find(selector: string) {
          return this.getContentElement().querySelector(selector)
        },

        findAll<T extends Element = AnyElement>(selector: string) {
          return this.getContentElement().querySelectorAll<T>(selector)
        },

        send: (msg: Message) => {
          const root = ctrl.getContentElement()

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
      })
    }
  }
}
