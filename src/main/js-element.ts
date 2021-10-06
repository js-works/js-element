// === exports =======================================================

// functions and singletons
export { component, createCtx, elem, intercept, prop, setMethods, Attrs }

// types
export { Ctx, Ctrl, MethodsOf, Listener }

// === data ==========================================================

const elemConfigByClass = new Map<
  Function,
  {
    tag: string
    impl: any // TODO!!!!!,
    shadow: boolean
    styles: string | string[] | (() => string | string[]) | null
    props: Map<string, PropConfig>
  }
>()

let ignoreAttributeChange = false

const interceptions = {
  init: [] as InterceptFn[],
  render: [] as InterceptFn[]
}

// === types =========================================================

type Methods = Record<string, (...args: any[]) => any>

type Component<M extends Methods = {}> = HTMLElement &
  M & { valueOf(): Component<M> }

type MethodsOf<T> = T extends Component<infer M> ? M : never

type PropConfig =
  | {
      propName: string
      hasAttr: false
    }
  | {
      propName: string
      hasAttr: true
      attrName: string
      reflect: boolean
      mapPropToAttr: (value: any) => string | null
      mapAttrToProp: (value: string | null) => any
    }

type Ctrl = {
  getName(): string
  getHost(): HTMLElement
  hasRendered(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  onceBeforeMount(task: () => void): void
  beforeMount(taks: () => void): void
  afterMount(task: () => void): void
  onceBeforeUpdate(task: () => void): void
  beforeUpdate(task: () => void): void
  afterUpdate(task: () => void): void
  beforeUnmount(task: () => void): void
}

type InterceptFn = (ctrl: Ctrl, next: () => void) => void

type Ctx<T> = Readonly<{
  kind: 'context'
  defaultValue: T
}>

type Listener<T> = (v: T) => void

// === decorators (all public) =======================================

function elem<E extends Component, C>(params: {
  tag: string
  shadow?: boolean
  impl: {
    patch: (content: C, container: HTMLElement) => void
    init: (self: E, ctrl: Ctrl) => () => C
  }
  styles?: string | string[] | (() => string | string[])
  uses?: any[]
}): (clazz: new () => E) => void

function elem<T, E extends Component & { value?: T }>(params: {
  tag: `${string}-provider`
  ctx: Ctx<T>
}): (clazz: new () => E) => void

function elem<E extends Component>(params: any) {
  return (clazz: new () => E): void => {
    definePropValue(clazz, 'tagName', params.tag)

    if (params.ctx) {
      const ctx = params.ctx

      params = {
        tag: params.tag,
        impl: {
          init: (self: E, ctrl: Ctrl) => initProvider(self, ctrl, ctx),
          patch: () => {}
        }
      }
    }

    let elemConfig = elemConfigByClass.get(clazz)

    if (!elemConfig) {
      elemConfig = {
        tag: params.tag,
        impl: params.impl,
        shadow: params.shadow !== false,
        styles: params.styles || null,
        props: new Map()
      }
      elemConfigByClass.set(clazz, elemConfig)
    } else {
      elemConfig.tag = params.tag
      elemConfig.shadow = params.shadow !== false
      elemConfig.styles = params.styles || null
      elemConfig.impl = params.impl
    }

    const propConfigs = Array.from(elemConfigByClass.get(clazz)!.props.values())

    if (propConfigs.length > 0) {
      addAttributeHandling(clazz, propConfigs)
    }

    registerElement(params.tag, clazz)
  }
}

function prop<T>(proto: Component, propName: string): void

function prop<T>(params?: {
  attr: {
    mapPropToAttr(value: T): string | null
    mapAttrToProp(value: string | null): T
  }
  refl?: boolean
}): (proto: Component, propName: string) => void

function prop(arg1?: any, arg2?: any): any {
  if (typeof arg2 === 'string') {
    return prop()(arg1, arg2)
  }

  const params = arg1 // TODO!!!

  const { attr, refl: reflect } = params || {}

  return (proto: Component, propName: string) => {
    const constructor = proto.constructor

    const propConfig: PropConfig = !attr
      ? { propName, hasAttr: false }
      : {
          propName,
          hasAttr: true,
          attrName: propNameToAttrName(propName),
          reflect: !!reflect,
          mapPropToAttr: attr.mapPropToAttr,
          mapAttrToProp: attr.mapAttrToProp
        }

    let elemConfig = elemConfigByClass.get(constructor)

    if (!elemConfig) {
      elemConfig = {
        tag: '',
        shadow: true,
        impl: null,
        styles: null,
        props: new Map()
      }

      elemConfigByClass.set(constructor, elemConfig)
    }

    elemConfig.props.set(propName, propConfig)
  }
}

// === other public functions ========================================

function component<M extends Methods = {}>(): new () => Component<M> {
  return BaseElement as any
}

function setMethods<M extends Methods>(obj: Component<M>, methods: M) {
  Object.assign(obj, methods)
}

function intercept(point: 'init' | 'render', fn: InterceptFn) {
  interceptions[point].push(fn)
}

// === base custom element class =====================================

class BaseElement extends HTMLElement {
  private __ctrl!: Ctrl

  constructor() {
    super()

    const self: any = this
    const elemConfig = elemConfigByClass.get(this.constructor)!
    const { init, patch } = elemConfig.impl
    let styles = elemConfig.styles

    if (typeof styles !== 'string') {
      styles = typeof styles === 'function' ? styles() : styles

      if (Array.isArray(styles)) {
        styles = styles.map((it) => it.trim()).join('\n\n/*******/\n\n')
      }

      if (!styles) {
        styles = ''
      }

      elemConfig.styles = styles
    }
    console.log(11111, elemConfig)
    if (elemConfig.shadow) {
      this.attachShadow({ mode: 'open' })
    }

    if (styles) {
      const styleElem = document.createElement('style')
      styleElem.appendChild(document.createTextNode(styles))

      if (!elemConfig.shadow) {
        document.head.append(styleElem)
        elemConfig.styles = null
      } else {
        const stylesElement = document.createElement('span')
        stylesElement.appendChild(styleElem)
        stylesElement.setAttribute('data-role', 'styles')
        this.shadowRoot!.append(stylesElement)
      }
    }

    const contentElement = document.createElement('span')
    contentElement.setAttribute('data-role', 'content')

    if (elemConfig.shadow) {
      this.shadowRoot!.append(contentElement)
    } else {
      this.append(contentElement)
    }

    let rendered = false
    let mounted = false
    let updated = false
    let shallCommit = false
    let getContent: () => any // TODO

    const onceBeforeMountNotifier = createNotifier()
    const onceBeforeUpdateNotifier = createNotifier()
    const beforeMountNotifier = createNotifier()
    const afterMountNotifier = createNotifier()
    const beforeUpdateNotifier = createNotifier()
    const afterUpdateNotifier = createNotifier()
    const beforeUnmountNotifier = createNotifier()

    const ctrl: Ctrl = {
      getName: () => this.localName,
      getHost: () => this,
      hasRendered: () => rendered,
      isMounted: () => mounted,
      hasUpdated: () => updated,
      onceBeforeMount: onceBeforeMountNotifier.subscribe,
      beforeMount: beforeMountNotifier.subscribe,
      afterMount: afterMountNotifier.subscribe,
      onceBeforeUpdate: onceBeforeUpdateNotifier.subscribe,
      beforeUpdate: beforeUpdateNotifier.subscribe,
      afterUpdate: afterUpdateNotifier.subscribe,
      beforeUnmount: beforeUnmountNotifier.subscribe,

      refresh: () => {
        if (!shallCommit) {
          shallCommit = true

          requestAnimationFrame(() => {
            shallCommit = false
            commit()
          })
        }
      }
    }

    this.__ctrl = ctrl

    const commit = () => {
      if (mounted) {
        try {
          onceBeforeUpdateNotifier.notify()
        } finally {
          onceBeforeUpdateNotifier.clear()
        }

        beforeUpdateNotifier.notify()
      }

      runIntercepted(
        () => {
          const content = getContent()
          // TODO
          try {
            patch(content, contentElement)
          } catch (e) {
            console.error(`Render error in "${ctrl.getName()}"`)
            throw e
          }
        },
        ctrl,
        interceptions.render
      )

      rendered = true

      if (!mounted) {
        mounted = true
        afterMountNotifier.notify()
      } else {
        updated = true
        afterUpdateNotifier.notify()
      }
    }

    runIntercepted(
      () => {
        getContent = init(this, ctrl)
      },
      ctrl,
      interceptions.init
    )

    self.connectedCallback = () => {
      if (!rendered) {
        addPropHandling(this)
        onceBeforeMountNotifier.notify()
        onceBeforeMountNotifier.close()
      }

      beforeMountNotifier.notify()
      commit()
    }

    self.disconnectedCallback = () => {
      beforeUnmountNotifier.notify()
      contentElement.innerHTML = ''
    }
  }

  // will be overridden in constructor
  connectedCallback() {
    this.connectedCallback()
  }

  // will be overridden in constructor
  disconnectedCallback() {
    this.disconnectedCallback()
  }
}

function addAttributeHandling(
  clazz: new () => Component,
  propConfigs: PropConfig[]
) {
  const proto: any = clazz.prototype
  const propConfigByPropName = new Map<string, PropConfig>()
  const propConfigByAttrName = new Map<string, PropConfig>()

  for (const propConfig of propConfigs) {
    propConfigByPropName.set(propConfig.propName, propConfig)

    if (propConfig.hasAttr) {
      propConfigByAttrName.set(propConfig.attrName, propConfig)
    }
  }

  ;(clazz as any).observedAttributes = Array.from(propConfigByAttrName.keys())

  proto.getAttribute = function (attrName: string): string | null {
    const propInfo = propConfigByAttrName.get(attrName)

    return propInfo && propInfo.hasAttr
      ? propInfo.mapPropToAttr((this as any)[propInfo.propName])
      : HTMLElement.prototype.getAttribute.call(this, attrName)
  }

  proto.attributeChangedCallback = function (
    this: any,
    attrName: string,
    oldValue: string | null,
    value: string | null
  ) {
    if (!ignoreAttributeChange) {
      const { propName, mapAttrToProp } = propConfigByAttrName.get(
        attrName
      ) as any

      if (typeof value === 'string') {
        this[propName] = mapAttrToProp(value)
      }
    }
  }
}

function addPropHandling(obj: any) {
  const clazz = obj.constructor
  const ctrl: Ctrl = obj.__ctrl
  const propConfigs = Array.from(elemConfigByClass.get(clazz)!.props.values())

  propConfigs.forEach((propConfig) => {
    const { propName, hasAttr } = propConfig

    let propValue = obj[propName]

    Object.defineProperty(obj, propName, {
      configurable: true, // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!

      get() {
        return propValue
      },

      set(value: any) {
        propValue = value

        if (propConfig.hasAttr && propConfig.reflect) {
          try {
            ignoreAttributeChange = true

            obj.setAttribute(
              propConfig.attrName,
              propConfig.mapPropToAttr(value)
            )
          } finally {
            ignoreAttributeChange = false
          }
        }

        ctrl.refresh()
      }
    })
  })
}

// === Attrs =========================================================

const Attrs = {
  string: {
    mapPropToAttr: (it: string | null) => it,
    mapAttrToProp: (it: string | null) => it
  },

  number: {
    mapPropToAttr: (it: number | null) => (it === null ? null : String(it)),
    mapAttrToProp: (it: string | null) =>
      it === null ? null : Number.parseFloat(it)
  },

  boolean: {
    mapPropToAttr: (it: boolean | null) => (!it ? null : ''),
    mapAttrToProp: (it: string | null) => (it === null ? false : true)
  }
}

// === tools =========================================================

function propNameToAttrName(propName: string) {
  return propName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

function createNotifier() {
  let subscribers: (() => void)[] | null = []

  return {
    subscribe(subscriber: () => void) {
      subscribers && subscribers.push(subscriber)
    },

    notify() {
      subscribers && subscribers.length && subscribers.forEach((it) => it())
    },

    clear() {
      subscribers && (subscribers.length = 0)
    },

    close() {
      subscribers = null
    }
  }
}

function runIntercepted<T = null>(
  action: () => void,
  payload: T,
  interceptors: ((payload: T, next: () => void) => void)[]
) {
  if (interceptors.length === 0) {
    action()
  } else {
    let next: () => void = () => action()

    for (let i = interceptors.length - 1; i >= 0; --i) {
      const nextFn = next

      next = () => void interceptors[i](payload, nextFn)
    }

    next()
  }
}

// === utils ================================================

function definePropValue(obj: object, propName: string, value: any) {
  Object.defineProperty(obj, propName, { value })
}

function registerElement(
  tagName: string,
  elementClass: CustomElementConstructor
): void {
  // TODO!!!!
  if (customElements.get(tagName)) {
    console.clear()
    console.log(`Custom element ${tagName} already defined -> reloading...`)

    setTimeout(() => {
      console.clear()
      location.reload()
    }, 1000)
  } else {
    customElements.define(tagName, elementClass)
  }
}

// === context =======================================================

function createCtx<T>(defaultValue?: T): Ctx<T> {
  return Object.freeze({
    kind: 'context',
    defaultValue: defaultValue!
  })
}

function initProvider(self: any, ctrl: Ctrl, ctx: Ctx<any>): () => null {
  const subscribers = new Set<any>() // TODO
  let cleanup: any = null // TODO
  let value = ctx.defaultValue

  const eventListener = (ev: any) => {
    if (ev.detail.context !== ctx) {
      return
    }

    const callback = ev.detail.callback

    ev.stopPropagation()
    subscribers.add(callback)

    ev.detail.cancelled.then(() => {
      subscribers.delete(callback)
    })
  }

  self.addEventListener('$$context$$', eventListener)

  cleanup = () => self.removeEventListener('$$context$$', eventListener)

  ctrl.afterUpdate(() => {
    if (self.value !== value) {
      value = self.value
      subscribers.forEach((subscriber) => subscriber(value))
    }
  })

  const contentContainer = self.shadowRoot.lastChild
  contentContainer.appendChild(document.createElement('slot'))

  return () => null
}
