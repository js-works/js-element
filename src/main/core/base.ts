import { Component, Ctrl, VNode } from './types'
import { renderer } from './vdom'

// @ts-ignore
import { patch } from './superfine'

// === exports =======================================================

export { attr, component, register }

// === local data =====================================================

const componentToCustomElementClassMap = new Map<Component<any>, any>() // TODO
const tagNameToComponentMap = new Map<string, Component<any>>()
const attrsOptionsByComponentClass = new Map<{ new (): any }, AttrsOptions>()

// === constants =====================================================

const MESSAGE_TYPE_SUFFIX = '$$js-elements$$::'
const EMPTY_OBJECT = {}

// === types ==========================================================

type AttrKind =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor

type AttrOptions = {
  kind: AttrKind
}

type AttrsOptions = Map<string, AttrOptions>

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

// === decorators =====================================================

function attr(kind: AttrKind): (proto: object, key: string) => void {
  return (proto: any, key: string) => {
    const componentClass = proto.constructor
    let attrsOptions = attrsOptionsByComponentClass.get(componentClass)

    if (!attrsOptions) {
      attrsOptions = new Map()
      attrsOptionsByComponentClass.set(componentClass, attrsOptions)
    }

    attrsOptions.set(key, { kind })
  }
}

// === helpers =======================================================

function component(main: () => () => VNode): Component<{}>

function component<P>(
  propsClass: { new (): P },
  main: (props: P) => () => VNode
): Component<Partial<P>>

function component(arg2: any, arg3?: any): any {
  const hasThreeArgs = typeof arg3 === 'function'
  const propsClass = hasThreeArgs ? arg2 : null

  const attrsOptions = propsClass
    ? attrsOptionsByComponentClass.get(propsClass) || null
    : null

  const main = hasThreeArgs ? arg3 : arg2

  const customElementClass = buildCustomElementClass(
    propsClass,
    attrsOptions,
    main
  )

  const component: Component<any> = (() => {}) as any // TODO!!!!!!!!!!!!!!!!!
  componentToCustomElementClassMap.set(component, customElementClass)

  return component
}

function register(tagName: string, component: Component<any> | any): void // TODO
function register(obj: Record<string, Component<any> | any>): void // TODO

function register(arg1: any, arg2?: any): void {
  if (typeof arg1 === 'object') {
    for (const tagName of Object.keys(arg1)) {
      register(tagName, arg1[tagName])
    }
  } else if (arg2.prototype instanceof Element) {
    if (customElements.get(arg1)) {
      console.clear()
      location.reload()
    } else {
      customElements.define(arg1, arg2)
    }
  } else {
    const tagName = arg1
    const component = arg2
    const registeredComponent = tagNameToComponentMap.get(tagName)
    const registeredTagName = (component as any)[Symbol.for('tagName')]
    const customElementClass = componentToCustomElementClassMap.get(component)

    if (!/^[a-z][a-z0-9-]*(-[a-z][a-z0-9]*)$/.test(tagName)) {
      throw Error(
        `Tried to register component with invalid tag name "${tagName}"`
      )
    } else if (!customElementClass) {
      throw Error('Tried to register invalid component')
    } else if (registeredComponent && registeredComponent !== component) {
      register(tagName, customElementClass)
      //throw Error(
      //  `A different component has already registered as "${tagName}"`
      //)
    } else if (registeredTagName && registeredTagName !== tagName) {
      throw Error(
        `The component has already been registered as "${registeredTagName}"`
      )
    } else if (!registeredComponent) {
      register(tagName, customElementClass)
      ;(component as any)[Symbol.for('tagName')] = tagName
      tagNameToComponentMap.set(tagName, component)
    }
  }
}

function buildCustomElementClass(
  propsClass: { new (): object } | null,
  attrsOptions: AttrsOptions | null,
  main: (props: any) => () => VNode
): CustomElementConstructor {
  const propNames = propsClass ? Object.keys(new propsClass()) : []

  const attrNameToPropNameMap: Map<string, string> = new Map(
    Array.from(attrsOptions ? attrsOptions.keys() : []).map((propName) => [
      propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
      propName
    ])
  )

  const propNameToAttrNameMap: Map<string, string> = new Map(
    Array.from(attrNameToPropNameMap).map(([k, v]) => [v, k])
  )

  const propNameToConverterMap: Map<string, PropConverter<any>> = new Map(
    !attrsOptions
      ? null
      : Array.from(attrsOptions.entries()).map(([propName, attrOptions]) => [
          propName,
          commonPropConverters[attrOptions.kind.name]
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

      for (const key of propNames) {
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
          console.error(`Render error in "${ctrl.getName()}"`)
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
          getName: () => (customElementClass as any)[Symbol.for('tagName')],
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
  },

  Date: {
    fromPropToString: (it: Date) => it.toISOString().substr(0, 10),

    fromStringToProp: (it: string) => {
      ;/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,2}$/.test(it)
        ? new Date(Date.parse(it))
        : new Date(NaN)
    }
  }
}