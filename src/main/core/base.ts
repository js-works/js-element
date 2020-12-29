import { Component, Ctrl, Message, VElement, VNode } from './types'
import { renderer } from './vdom'

// @ts-ignore
import { patch } from './superfine'

// === exports =======================================================

export { prop, define }

// === local data =====================================================

const propsOptionsByComponentClass = new Map<{ new (): any }, PropsOptions>()

// === constants =====================================================

const MESSAGE_TYPE_SUFFIX = '$$js-elements$$::'
const EMPTY_OBJECT = {}

// === types ==========================================================

type PropOptions = {
  attr?: StringConstructor | NumberConstructor | BooleanConstructor
}

type PropsOptions = Map<string, PropOptions>

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

// === decorators =====================================================

function prop(options?: PropOptions): (proto: object, key: string) => void {
  return (proto: any, key: string) => {
    const componentClass = proto.constructor
    let propsOptions = propsOptionsByComponentClass.get(componentClass)

    if (!propsOptions) {
      propsOptions = new Map()
      propsOptionsByComponentClass.set(componentClass, propsOptions)
    }

    propsOptions.set(key, options || EMPTY_OBJECT)
  }
}

// === helpers =======================================================

function define(tagName: string, main: () => () => VNode): Component<{}>

function define<P>(
  tagName: string,
  propsClass: { new (): P },
  main: (props: P) => () => VNode
): Component<Partial<P>>

function define(tagName: string, arg2: any, arg3?: any): any {
  const hasThreeArgs = typeof arg3 === 'function'
  const propsClass = hasThreeArgs ? arg2 : null

  const propsOptions = propsClass
    ? propsOptionsByComponentClass.get(propsClass) ||
      new Map(Object.keys(new propsClass()).map((key) => [key, {}]))
    : null

  const main = hasThreeArgs ? arg3 : arg2

  const customElementClass = buildCustomElementClass(
    tagName,
    propsClass,
    propsOptions,
    main
  )

  try {
    customElements.define(tagName, customElementClass)
  } catch {
    // TODO
    console.clear()
    globalThis.location.reload()
  }

  const ret = () => {} // TODO

  ;(ret as any)[Symbol.for('tagName')] = tagName

  return ret
}

function buildCustomElementClass(
  tagName: string,
  propsClass: { new (): object } | null,
  propsOptions: PropsOptions | null,
  main: (props: any) => () => VNode
): CustomElementConstructor {
  const propsOptionsEntries = propsOptions
    ? Array.from(propsOptions.entries())
    : []

  const attrNameToPropNameMap: Map<string, string> = new Map(
    propsOptionsEntries
      .filter(([, { attr }]) => !!attr)
      .map(([key]) => [
        key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
        key
      ])
  )

  const propNameToAttrNameMap: Map<string, string> = new Map(
    Array.from(attrNameToPropNameMap).map(([k, v]) => [v, k])
  )

  const propNameToConverterMap: Map<string, PropConverter<any>> = new Map(
    propsOptionsEntries
      .filter(([, { attr }]) => !!attr)
      .map(([propName, { attr }]) => [
        propName,
        commonPropConverters[attr!.name]!
      ])
  )

  const customElementClass = class extends HTMLElement {
    static observedAttributes = Array.from(attrNameToPropNameMap.keys())

    connectedCallback() {
      // TODO - this is extremely odd
      this.connectedCallback()
    }

    disconnectedCallback() {
      // TODO - this is extremely odd
      this.disconnectedCallback()
    }

    getAttribute(attrName: string): string | null {
      return this.getAttribute(attrName)
    }

    attributeChangedCallback() {
      this.attributeChangedCallback.apply(this, arguments as any)
    }

    constructor() {
      super()
      const self: any = this
      const data: any = propsClass ? new propsClass() : {}
      const ctrl = createCtrl()

      let isInitialized = false
      let isMounted = false
      let hasUpdated = false
      let hasRequestedRefresh = false

      let afterMountNotifier: Notifier | undefined
      let beforeUpdateNotifier: Notifier | undefined
      let afterUpdateNotifier: Notifier | undefined
      let beforeUnmountNotifier: Notifier | undefined
      let onceBeforeUpdateActions: (() => void)[] | undefined

      let stylesElement: HTMLElement | undefined
      let contentElement: HTMLElement | undefined
      let render: (() => VNode) | undefined

      for (const [key, options] of propsOptionsEntries) {
        if (key !== 'ref') {
          Object.defineProperty(self, key, {
            get() {
              return data[key]
            },

            set(value: any) {
              data[key] = value
              ctrl.refresh()
            }
          })
        } else {
          let componentMethods: any = null
          data.ref = {}

          Object.defineProperty(data.ref, 'current', {
            enumerable: true,

            get() {
              return componentMethods
            },

            set(methods: any) {
              if (componentMethods) {
                throw new Error('Methods can only be set once')
              } else if (methods) {
                componentMethods = methods
                Object.assign(self, componentMethods)
              }
            }
          })
        }
      }

      self.connectedCallback = () => {
        self.attachShadow({ mode: 'open' })
        const root = self.shadowRoot!

        stylesElement = document.createElement('span')
        contentElement = document.createElement('span')

        stylesElement.setAttribute('data-role', 'styles')
        contentElement.setAttribute('data-role', 'content')

        root.appendChild(stylesElement)
        root.appendChild(contentElement)

        refresh()
      }

      self.disconnectedCallback = () => {
        beforeUnmountNotifier && beforeUnmountNotifier.notify()
        contentElement!.innerHTML = ''
      }

      self.getAttribute = (attrName: string): string | null => {
        const propName = attrNameToPropNameMap.get(attrName)

        if (propName) {
          return propNameToConverterMap
            .get(propName)!
            .fromPropToString(self[propName])
        }

        return super.getAttribute(attrName)
      }

      self.attributeChangedCallback = (
        attrName: string,
        oldValue: string | null,
        value: string | null
      ) => {
        const propName = attrNameToPropNameMap.get(attrName)

        if (propName && typeof value === 'string') {
          self[propName] = propNameToConverterMap
            .get(propName)!
            .fromStringToProp(value)
        }
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

          beforeUpdateNotifier && beforeUpdateNotifier.notify()
        }

        if (!render) {
          ;(globalThis as any).__currCompCtrl__ = ctrl

          try {
            render = main(data)
          } finally {
            ;(globalThis as any).__currCompCtrl__ = null
          }
        }

        const content = render()

        // TODO
        try {
          renderer(content, contentElement!)
        } catch (e) {
          console.error(`Render error in "${tagName}"`)
          throw e
        }

        isInitialized = true

        if (!isMounted) {
          isMounted = true
          afterMountNotifier && afterMountNotifier.notify()
        } else {
          hasUpdated = true
          afterUpdateNotifier && afterUpdateNotifier.notify()
        }
      }

      function createCtrl(): Ctrl {
        return {
          getName: () => tagName,
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

          afterMount(task) {
            afterMountNotifier || (afterMountNotifier = createNotifier())
            afterMountNotifier.subscribe(task)
          },

          onceBeforeUpdate(task) {
            onceBeforeUpdateActions || (onceBeforeUpdateActions = [])
            onceBeforeUpdateActions.push(task)
          },

          beforeUpdate(task) {
            beforeUpdateNotifier || (beforeUpdateNotifier = createNotifier())
            beforeUpdateNotifier.subscribe(task)
          },

          afterUpdate(task) {
            afterUpdateNotifier || (afterUpdateNotifier = createNotifier())
            afterUpdateNotifier.subscribe(task)
          },

          beforeUnmount(task) {
            beforeUnmountNotifier || (beforeUnmountNotifier = createNotifier())
            beforeUnmountNotifier.subscribe(task)
          },

          getRoot() {
            return self
          },

          addStyles(styles: string | string[]): void {
            const css = Array.isArray(styles)
              ? styles.join('\n\n/* =============== */\n\n')
              : styles

            const styleElem = document.createElement('style')
            styleElem.appendChild(document.createTextNode(css))
            stylesElement!.appendChild(styleElem)
          },

          send(msg): void {
            self.dispatchEvent(
              new CustomEvent(MESSAGE_TYPE_SUFFIX + msg.type, {
                bubbles: true,
                composed: true,
                detail: msg
              })
            )
          },

          receive(type, handler) {
            const root = contentElement!

            const listener = (ev: Event) => {
              ev.stopPropagation()
              handler((ev as any).detail)
            }

            const unsubscribe = () => {
              root.removeEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
            }

            root.addEventListener(MESSAGE_TYPE_SUFFIX + type, listener)
            this.beforeUnmount(unsubscribe)

            return unsubscribe
          }
        }
      }
    }
  }

  return customElementClass
}

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

// === attribute converters ==========================================

const commonPropConverters: Record<string, PropConverter<any>> = {
  String: {
    fromPropToString: (it: string) => it,
    fromStringToProp: (it: string) => it
  },

  Number: {
    fromPropToString: (it: number) => String(it),
    fromStringToProp: (it: string) => Number.parseFloat(it)
  },

  Boolean: {
    fromPropToString: (it: boolean) => (it ? 'true' : 'false'),
    fromStringToProp: (it: string) => (it === 'true' ? true : false)
  }
}
