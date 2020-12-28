import { Component, Ctrl, Message, VElement, VNode } from './types'
import { renderer } from './vdom'

// @ts-ignore
import { patch } from './superfine'

// === exports =======================================================

export { element, prop }

// === local data =====================================================

const propsOptionsByComponentClass = new Map<Component<any>, PropsOptions>()

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

function element(
  name: `${string}-${string}`
): (componentClass: Component<any>) => void

function element<M extends string[]>(
  name: `${string}-${string}`,

  config: {
    slots?: string[]
    methods?: M
  }
): (componentClass: Component<any>) => void

function element(name: string, config?: any) {
  return (componentClass: Component<any>) => {
    const propDefs = propsOptionsByComponentClass.get(componentClass) || null
    propsOptionsByComponentClass.delete(componentClass) // not needed any longer

    const customElementClass = buildCustomElementClass(
      name,
      componentClass,
      propDefs,
      config ? config.methods || [] : []
    )

    try {
      customElements.define(name, customElementClass)
    } catch {
      // TODO
      console.clear()
      globalThis.location.reload()
    }

    ;(componentClass as any)[Symbol.for('tagName')] = name
  }
}

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

function buildCustomElementClass(
  tagName: string,
  componentClass: Component<any>,
  propsOptions: PropsOptions | null,
  methodNames: string[]
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
      const data: any = new componentClass()
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
          data.ref = {}

          Object.defineProperty(data.ref, 'current', {
            enumerable: true,

            get() {
              return self.__methods
            },

            set(methods: any) {
              self.__methods = methods
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
            render = componentClass.main(data)
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

  if (methodNames && methodNames.length > 0) {
    methodNames.forEach((methodName) => {
      // TODO
      ;(customElementClass as any).prototype[methodName] = function () {
        // TODO
        const fn = this.__methods[methodName]

        if (!fn) {
          throw new Error(
            `Handler for method "${methodName}" of component "${tagName}" has not been set`
          )
        }

        return fn.apply(null, arguments)
      }
    })
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
