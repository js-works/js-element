import {
  h as createElement,
  text as createText,
  patch
} from './lib/patched-superfine'
import htm from 'htm'

// === exports =======================================================

// public API
export { attr, define, event, h, html, ref, EventHandler, MethodsOf }

// internally used exports
export { Component, Ctrl, Props, Ref, State, UIEvent, VElement, VNode }

// === local data =====================================================

const EMPTY_ARR: any[] = []
const EMPTY_OBJ = {}
const attrsOptionsByComponentClass = new Map<{ new (): any }, AttrsOptions>()

// === types ==========================================================

type Props = Record<string, any> // TODO
type VElement<T extends Props = Props> = Record<any, any> // TODO
type Ref<T> = { current: T | null }
type Methods = Record<string, (...args: any[]) => any>
type EventHandler<T> = (ev: T) => void
type UIEvent<T extends string, D = null> = CustomEvent<D> & { type: T }
type VNode = null | boolean | number | string | VElement | Iterable<VNode>
type Task = () => void
type Message = { type: string } & Record<string, any>
type State = Record<string, any>

type Component<P> = {
  (props?: P, ...children: VNode[]): VElement<P>
  tagName: string
}

type MethodsOf<C> = C extends Component<infer P>
  ? P extends { ref?: Ref<infer M> }
    ? M
    : never
  : never

type Ctrl = {
  getName(): string
  getHost(): HTMLElement
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  afterMount(task: Task): void
  onceBeforeUpdate(task: Task): void
  beforeUpdate(task: Task): void
  afterUpdate(task: Task): void
  beforeUnmount(task: Task): void
}

export type Store<S extends State> = {
  getState(): S
  subscribe(subscriber: () => void): () => void
  dispatch(msg: Message): void
  destroy?(): void
}

type AttrKind = StringConstructor | NumberConstructor | BooleanConstructor
type AttrOptions = { kind: AttrKind }
type AttrsOptions = Map<string, AttrOptions>

type PropConverter<T> = {
  fromPropToString(value: T): string
  fromStringToProp(value: string): T
}

type Notifier = {
  subscribe(subscriber: () => void): void
  notify(): void
}

// === public decorators =============================================

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

// === public functions ==============================================

function ref<T>(value: T | null = null): Ref<T> {
  return { current: value }
}

function event<T extends string, D = null>(
  type: T,
  detail?: D,
  options?: { bubbles: boolean; cancelable?: boolean }
): UIEvent<T, D> {
  const params = {
    detail: detail || null,
    bubbles: !options || !!options.bubbles,
    cancabble: !options || !!options.cancelable,
    composed: true
  }

  return new CustomEvent(type, params) as UIEvent<T, D>
}

function define(tagName: string, main: () => () => VNode): Component<{}>

function define<P extends Props>(
  tagName: string,
  propsClass: { new (): P },
  main: (props: P) => () => VNode
): Component<Partial<P>>

function define(tagName: string, arg2: any, arg3?: any): any {
  if (process.env.NODE_ENV === ('development' as string)) {
    const argc = arguments.length

    if (typeof tagName !== 'string') {
      throw new TypeError('[component] First argument must be a string')
    }

    if (typeof arg2 !== 'function') {
      throw new TypeError('[component] Expected function as second argument')
    }

    if (argc > 2 && typeof arg3 !== 'function') {
      throw new TypeError('[component] Expected function as third argument')
    }

    if (argc > 3) {
      throw new TypeError('[component] Unexpected fourth argument')
    }
  }

  const propsClass = typeof arg3 === 'function' ? arg2 : null
  const main = propsClass ? arg3 : arg2

  const attrsOptions = propsClass
    ? attrsOptionsByComponentClass.get(propsClass) || null
    : null

  const customElementClass = buildCustomElementClass(
    tagName,
    propsClass,
    attrsOptions,
    main
  )

  const ret = h.bind(tagName)

  Object.defineProperty(ret, 'tagName', {
    value: tagName
  })

  if (customElements.get(tagName)) {
    console.clear()
    location.reload()
  } else {
    customElements.define(tagName, customElementClass)
  }

  return ret
}

// === locals ========================================================

function buildCustomElementClass<T extends object>(
  name: string,
  propsClass: { new (): T } | null,
  attrsOptions: AttrsOptions | null,
  main: (props: T) => () => VNode
): CustomElementConstructor {
  const propNames = propsClass ? Object.keys(new propsClass()) : []

  const attrNameToPropNameMap: Map<string, string> = new Map(
    Array.from(attrsOptions ? attrsOptions.keys() : []).map((propName) => [
      propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
      propName
    ])
  )

  const propNameToConverterMap: Map<string, PropConverter<any>> = new Map(
    !attrsOptions
      ? null
      : Array.from(attrsOptions.entries()).map(([propName, attrOptions]) => {
          const kind = attrOptions.kind

          // TODO!!!
          const propConv =
            kind === Boolean
              ? booleanPropConv
              : kind === Number
              ? numberPropConv
              : stringPropConv

          return [propName, propConv]
        })
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
      const afterMountNotifier = createNotifier()
      const beforeUpdateNotifier = createNotifier()
      const afterUpdateNotifier = createNotifier()
      const beforeUnmountNotifier = createNotifier()
      const onceBeforeUpdateActions: Task[] = []
      const ctrl = createCtrl()

      let isInitialized = false
      let isMounted = false
      let hasUpdated = false
      let hasRequestedRefresh = false
      let stylesElement: HTMLElement | undefined
      let contentElement: HTMLElement | undefined
      let render: (() => VNode) | undefined

      for (const key of propNames) {
        if (key !== 'ref') {
          Object.defineProperty(self, key, {
            get: () => data[key],
            set: (value: any) => ((data[key] = value), ctrl.refresh())
          })
        } else {
          let componentMethods: any = null
          data.ref = {}

          Object.defineProperty(data.ref, 'current', {
            enumerable: true,
            get: () => componentMethods,

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
        const root = self.attachShadow({ mode: 'open' })
        stylesElement = document.createElement('span')
        contentElement = document.createElement('span')
        stylesElement.setAttribute('data-role', 'styles')
        contentElement.setAttribute('data-role', 'content')
        root.append(stylesElement, contentElement)
        refresh()
      }

      self.disconnectedCallback = () => {
        beforeUnmountNotifier.notify()
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

          beforeUpdateNotifier.notify()
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
          afterMountNotifier.notify()
        } else {
          hasUpdated = true
          afterUpdateNotifier.notify()
        }
      }

      function createCtrl(): Ctrl {
        return {
          getName: () => name,
          getHost: () => self,
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

          afterMount: afterMountNotifier.subscribe,
          onceBeforeUpdate: (task) => void onceBeforeUpdateActions.push(task),
          beforeUpdate: beforeUpdateNotifier.subscribe,
          afterUpdate: afterUpdateNotifier.subscribe,
          beforeUnmount: beforeUnmountNotifier.subscribe
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
    subscribe: (subscriber: () => void) => void subscribers.push(subscriber),
    notify: () => subscribers.forEach((subscriber) => subscriber())
  }
}

// === prop converters ===============================================

const stringPropConv = {
  fromPropToString: (it: string) => it,
  fromStringToProp: (it: string) => it
}

const numberPropConv = {
  fromPropToString: (it: number) => String(it),
  fromStringToProp: (it: string) => Number.parseFloat(it)
}

const booleanPropConv = {
  fromPropToString: (it: boolean) => (it ? 'true' : 'false'),
  fromStringToProp: (it: string) => (it === 'true' ? true : false)
}

// === h ==============================================================

function h(
  type: string,
  props?: Props | null, // TODO!!!
  ...children: VNode[]
): VElement

function h<P extends Props>(
  type: Component<P>,
  props?: Partial<P> | null,
  ...children: VNode[]
): VElement

function h(type: string | Component<any>, props?: Props | null): VElement {
  const argc = arguments.length
  const tagName = typeof type === 'function' ? (type as any).tagName : type

  if (process.env.NODE_ENV === ('development' as string)) {
    if (typeof tagName !== 'string') {
      throw new Error('[h] First argument must be a string or a component')
    }
  }

  const children = argc > 2 ? [] : EMPTY_ARR

  if (argc > 2) {
    for (let i = 2; i < argc; ++i) {
      const child = arguments[i]

      if (!Array.isArray(child)) {
        children.push(asVNode(child))
      } else {
        for (let j = 0; j < child.length; ++j) {
          children.push(asVNode(child[j]))
        }
      }
    }
  }

  const ret: any = createElement(tagName, props || EMPTY_OBJ, children)
  ret.isVElement = true
  return ret
}

// === render ========================================================

export function render(content: VElement, container: Element | string) {
  if (process.env.NODE_ENV === ('development' as string)) {
    if (content !== null && (!content || content.isVElement !== true)) {
      throw new TypeError()
      ;('First argument "content" of function "render" must be a virtual element or null')
    }

    if (!container || (typeof container !== 'string' && !container.tagName)) {
      throw new TypeError(
        'Second argument "container" of function "render" must either be a DOM element or selector string for the DOM element'
      )
    }
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
    renderer(content, target)
  }
}

// === html ==========================================================

const html = htm.bind(h)

// === helpers =======================================================

export const renderer = (content: VNode, target: Element) => {
  if (target.hasChildNodes()) {
    patch(target.firstChild, content)
  } else {
    const newTarget = document.createElement('span')

    target.appendChild(newTarget)
    patch(newTarget, content)
  }
}

function asVNode(x: any): any {
  return typeof x === 'number' || typeof x === 'string'
    ? createText(x, null)
    : x
}
