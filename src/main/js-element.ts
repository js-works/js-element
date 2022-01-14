// === exports =======================================================

// functions and singletons
export { createCtx, elem, intercept, method, prop, setMethods, Attrs }

// types
export { Ctx, Ctrl, Listener }

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

  onFormAssociated(task: (form: HTMLFormElement) => void): void
  onFormStateRestore(task: (state: any, mode: any) => void): void // TODO!!!
  onFormDisabled(task: (disabled: boolean) => void): void
  onFormReset(task: () => void): void
}

type InterceptFn = (ctrl: Ctrl, next: () => void) => void

type Ctx<T> = Readonly<{
  kind: 'context'
  defaultValue: T
}>

type Listener<T> = (v: T) => void

// === decorators (all public) =======================================

function elem<E extends HTMLElement, C>(params: {
  tag: string
  shadow?: boolean
  impl: {
    patch: (content: C, container: HTMLElement) => void
    init: (self: E, ctrl: Ctrl) => () => C
  }
  styles?: string | string[] | (() => string | string[])
  formAssoc?: boolean
  uses?: any[]
}): (clazz: new () => E) => void

function elem<T, E extends HTMLElement & { value?: T }>(params: {
  tag: `${string}-provider`
  ctx: Ctx<T>
}): (clazz: new () => E) => void

function elem<E extends HTMLElement>(params: any) {
  return (clazz: new () => E): void => {
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

    if (params.formAssoc) {
      definePropValue(clazz, 'formAssociated', true)

      // all those four methods will be overridden
      // in construtor
      Object.assign(clazz.prototype, {
        formAssociatedCallback(form: HTMLFormElement) {
          this.formAssociatedCallback(form)
        },

        formDisabledCallback(disabled: boolean) {
          this.formDisabledCallback(disabled)
        },

        formResetCallback() {
          this.formResetCallback()
        },

        // TODO - argument types
        formStateRestoreCallback(state: any, mode: any) {
          this.formStateRestoreCallback(state, mode)
        }
      })
    }

    if (propConfigs.length > 0) {
      addAttributeHandling(clazz, propConfigs)
    }

    const ret = class extends (clazz as any) {
      constructor() {
        super()
        initComponent(this)
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

    definePropValue(ret, 'name', clazz.name)
    definePropValue(clazz, 'name', '')
    definePropValue(ret, 'tagName', params.tag)

    registerElement(params.tag, ret as any)
    return ret as any
  }
}

function prop<T>(proto: HTMLElement, propName: string): void

function prop<T>(params?: {
  attr: {
    mapPropToAttr(value: T): string | null
    mapAttrToProp(value: string | null): T
  }
  refl?: boolean
}): (proto: HTMLElement, propName: string) => void

function prop(arg1?: any, arg2?: any): any {
  if (typeof arg2 === 'string') {
    return prop()(arg1, arg2)
  }

  const params = arg1 // TODO!!!

  const { attr, refl: reflect } = params || {}

  return (proto: HTMLElement, propName: string) => {
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

function method(proto: HTMLElement, propName: string): void {}

// === other public functions ========================================

// TODO - types
function setMethods<T extends HTMLElement>(obj: T, methods: Partial<T>) {
  Object.assign(obj, methods)
}

function intercept(point: 'init' | 'render', fn: InterceptFn) {
  interceptions[point].push(fn)
}

// === local funtions ================================================

function initComponent(self: any) {
  const formAssociated =
    Object.getPrototypeOf(self.constructor).formAssociated === true // TODO!!!

  const elemConfig = elemConfigByClass.get(
    Object.getPrototypeOf(self.constructor)
  )!

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

  if (elemConfig.shadow) {
    self.attachShadow({ mode: 'open' })
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
      self.shadowRoot!.append(stylesElement)
    }
  }

  const contentElement = document.createElement('span')
  contentElement.setAttribute('data-role', 'content')

  if (elemConfig.shadow) {
    self.shadowRoot!.append(contentElement)
  } else {
    self.append(contentElement)
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

  const formAssociatedNotifier = createNotifier<HTMLFormElement>()
  const formStateRestoreNotifier = createNotifier<any, any>() // TODO
  const formDisabledNotifier = createNotifier<boolean>()
  const formResetNotifier = createNotifier()

  const ctrl: Ctrl = {
    getName: () => self.localName,
    getHost: () => self,
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

    onFormAssociated: formAssociatedNotifier.subscribe,
    onFormStateRestore: formStateRestoreNotifier.subscribe,
    onFormDisabled: formDisabledNotifier.subscribe,
    onFormReset: formStateRestoreNotifier.subscribe,

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

  self.__ctrl = ctrl

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
      getContent = init(self, ctrl)
    },
    ctrl,
    interceptions.init
  )

  self.connectedCallback = () => {
    if (!rendered) {
      addPropHandling(self)
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

  if (formAssociated) {
    self.formAssociatedCallback = (form: HTMLFormElement) => {
      formAssociatedNotifier.notify(form)
    }

    self.formDisabledCallback = (disabled: boolean) => {
      formDisabledNotifier.notify(disabled)
    }

    self.formResetCallback = () => {
      formResetNotifier.notify()
    }

    // TODO!!!
    self.formStateRestoreCallback = (state: any, mode: any) => {
      formStateRestoreNotifier.notify(state, mode)
    }
  }
}

function addAttributeHandling(
  clazz: new () => HTMLElement,
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
  const clazz = Object.getPrototypeOf(obj.constructor)
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

function createNotifier<T = void, T2 = void>() {
  let subscribers: ((value: T, value2: T2) => void)[] | null = []

  return {
    subscribe(subscriber: (value: T, value2: T2) => void) {
      subscribers && subscribers.push(subscriber)
    },

    notify(value: T, value2: T2) {
      subscribers &&
        subscribers.length &&
        subscribers.forEach((it) => it(value, value2))
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
