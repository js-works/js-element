// === exports =======================================================

export { createCustomElementClass, intercept, Attr, Ctrl, PropConfig }

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
  isInitialized(): boolean
  isMounted(): boolean
  hasUpdated(): boolean
  refresh(): void
  beforeMount(taks: () => void): void
  afterMount(task: () => void): void
  onceBeforeUpdate(task: () => void): void
  beforeUpdate(task: () => void): void
  afterUpdate(task: () => void): void
  beforeUnmount(task: () => void): void
}

type InterceptFn = (ctrl: Ctrl, next: () => void) => void

// === local data =====================================================

let ignoreAttributeChange = false

const interceptions = {
  init: [] as InterceptFn[],
  render: [] as InterceptFn[]
}

// === built-in attr types  ==========================================

const Attr = {
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

// === functions =====================================================

function createNotifier() {
  const subscribers: (() => void)[] = []

  return {
    subscribe: (subscriber: () => void) => void subscribers.push(subscriber),
    notify: () => void (subscribers.length && subscribers.forEach((it) => it()))
  }
}

function intercept(point: 'init' | 'render', fn: InterceptFn) {
  interceptions[point].push(fn)
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

function createCustomElementClass<C>(
  name: string,
  prepare: (host: HTMLElement, ctrl: Ctrl) => void,
  init: (host: HTMLElement, ctrl: Ctrl) => () => C,
  render: (content: C, target: HTMLElement) => void,
  propConfigs?: PropConfig[] | null,
  onPropChange?: ((ctrl: Ctrl, propName: string, value: any) => void) | null
): { new (): HTMLElement } {
  const ctrls = new WeakMap<HTMLElement, Ctrl>() // TODO!!!!!

  const customElementClass = class extends HTMLElement {
    constructor() {
      super()

      const stylesElement = document.createElement('div')
      const contentElement = document.createElement('div')
      this.attachShadow({ mode: 'open' })
      contentElement.append(document.createElement('span'))
      this.shadowRoot!.append(stylesElement, contentElement)

      let initialized = false
      let mounted = false
      let updated = false
      let shallCommit = false
      let getContent: () => any // TODO

      const beforeMountNotifier = createNotifier()
      const afterMountNotifier = createNotifier()
      const beforeUpdateNotifier = createNotifier()
      const afterUpdateNotifier = createNotifier()
      const beforeUnmountNotifier = createNotifier()
      const onceBeforeUpdateActions: (() => void)[] = []

      const ctrl: Ctrl = {
        getName: () => name,
        getHost: () => this,
        isInitialized: () => initialized,
        isMounted: () => mounted,
        hasUpdated: () => updated,
        beforeMount: beforeMountNotifier.subscribe,
        afterMount: afterMountNotifier.subscribe,
        onceBeforeUpdate: (task: () => void) =>
          onceBeforeUpdateActions.push(task),
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

      const commit = () => {
        if (mounted) {
          if (onceBeforeUpdateActions.length) {
            try {
              onceBeforeUpdateActions.forEach((action) => action())
            } finally {
              onceBeforeUpdateActions.length = 0
            }
          }

          beforeUpdateNotifier.notify()
        }

        // TODO xxxx
        runIntercepted(
          () => {
            if (!getContent) {
              // TODO: why is this happening sometimes?
              return
            }

            const content = getContent()
            // TODO
            try {
              render(content, contentElement)
            } catch (e) {
              console.error(`Render error in "${ctrl.getName()}"`)
              throw e
            }
          },
          ctrl,
          interceptions.render
        )

        initialized = true

        if (!mounted) {
          mounted = true
          afterMountNotifier.notify()
        } else {
          updated = true
          afterUpdateNotifier.notify()
        }
      }

      ;(this as any).connectedCallback = () => {
        if (!initialized) {
          runIntercepted(
            () => {
              getContent = init(this, ctrl)
            },
            ctrl,
            interceptions.init
          )
        }

        beforeMountNotifier.notify()

        commit()
      }
      ;(this as any).disconnectedCallback = () => {
        beforeUnmountNotifier.notify()
        contentElement.innerHTML = ''
      }

      prepare(this, ctrl)
      ctrls.set(this, ctrl) // TODO!!!!!!!!!!!!!!!!!!!!

      ctrl.beforeUnmount(() => ctrls.delete(this))
    }

    connectedCallback() {
      this.connectedCallback()
    }

    disconnectedCallback() {
      this.disconnectedCallback()
    }
  }

  // --- add props handling ------------------------------------------

  if (propConfigs && propConfigs.length > 0) {
    const propConfigByPropName = new Map<string, PropConfig>()
    const propConfigByAttrName = new Map<string, PropConfig>()

    for (const propConfig of propConfigs) {
      propConfigByPropName.set(propConfig.propName, propConfig)

      if (propConfig.hasAttr) {
        propConfigByAttrName.set(propConfig.attrName, propConfig)
      }

      const proto: any = customElementClass.prototype

      ;(customElementClass as any).observedAttributes = Array.from(
        propConfigByAttrName.keys()
      )

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
          const propInfo = propConfigByAttrName.get(attrName)!

          if (typeof value === 'string') {
            this[propInfo.propName] = ((propInfo as any).mapAttrToProp as any)(
              value
            )
          }
        }
      }

      for (const propConfig of propConfigByPropName.values()) {
        const { propName } = propConfig

        if (propName === 'ref') {
          continue
        }

        const setPropDescriptor = function (target: any) {
          let propValue: any

          Object.defineProperty(target, propName, {
            get() {
              return propValue
            },

            set(value: any) {
              propValue = value

              if (propConfig.hasAttr && propConfig.reflect) {
                try {
                  ignoreAttributeChange = true

                  target.setAttribute(
                    propConfig.attrName,
                    propConfig.mapPropToAttr(value)
                  )
                } finally {
                  ignoreAttributeChange = false
                }
              }

              const ctrl = ctrls.get(this) // TODO!!!!!!!!!!
              ctrl && onPropChange && onPropChange(ctrl, propName, value) // TODO!!!!!!
            }
          })
        }

        Object.defineProperty(proto, propName, {
          configurable: true,

          get() {
            setPropDescriptor(this)
            return undefined
          },

          set(this: any, value: any) {
            setPropDescriptor(this)
            this[propName] = value
          }
        })
      }
    }
  }

  return customElementClass
}
