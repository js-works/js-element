import { Action, PropsConfig, PropConfig, PropConverter } from './types'

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

export function createBaseElementClass(
  name: string,
  propsConfig: PropsConfig | null,
  methodNames: string[] | null
) {
  const propNames = propsConfig ? Object.keys(propsConfig) : []
  const attrNames: string[] = []
  const attrNameToPropNameMap: Map<string, string> = new Map()
  const eventNameSet = new Set()
  const eventNameToPropNameMap = new Map<string, string>()
  const propConverters = new Map<string, PropConverter<any>>()

  if (propNames.length > 0) {
    for (const propName of propNames) {
      const propConfig = propsConfig![propName] as PropConfig

      if (isEventPropName(propName)) {
        const eventName = eventPropNameToEventName(propName)
        eventNameSet.add(eventName)
        eventNameToPropNameMap.set(eventName, propName)
      } else if (isAttr(propConfig)) {
        const attrName = propNameToAttrName(propName)
        attrNames.push(attrName)
        attrNameToPropNameMap.set(attrName, propName)
        propConverters.set(
          propName,
          commonPropConverters[
            propConfig.type ? (propConfig.type as any).name : ''
          ]
        ) // TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      }
    }
  }

  const baseClass = class extends HTMLElement {
    static observedAttributes = attrNames

    _onPropChange: (propName: string, value: any) => void
    _onContentElementCreated: (contentElement: Element) => void
    _onStylesElementCreated: (stylesElement: Element) => void
    _performRefresh: Action
    _getMethodByName: (name: string) => Function | null
    _properties: Record<string, any> = {}
    _listenersByEventName: Map<
      string,
      Set<((ev: Event) => void) | { handleEvent(ev: Event): void }>
    > = new Map()

    constructor(
      onPropChange: (propName: string, value: any) => void,
      onContentElementCreated: (contentElement: Element) => void,
      onStylesElementCreated: (stylesElement: Element) => void,
      performRefresh: () => void,
      getMethodByName: (name: string) => Function | null
    ) {
      super()
      this._onPropChange = onPropChange
      this._onContentElementCreated = onContentElementCreated
      this._onStylesElementCreated = onStylesElementCreated
      this._performRefresh = performRefresh
      this._getMethodByName = getMethodByName

      for (const propName of propNames) {
        let setter: (value: any) => void

        if (!isEventPropName(propName)) {
          setter = (value) => {
            this._properties[propName] = value
            this._onPropChange(propName, value)
            this._performRefresh()
          }
        } else {
          const eventName = eventPropNameToEventName(propName)

          setter = (value) => {
            const oldValue = this._properties[propName]
            this._properties[propName] = value

            if (oldValue) {
              this.removeEventListener(eventName, oldValue)
            }

            if (value) {
              this.addEventListener(eventName, value)
            }

            this._performRefresh()
          }
        }

        Object.defineProperty(this, propName, {
          set: setter,
          get: () => this._properties[propName]
        })
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
      this._onContentElementCreated(contentElem)
      this._onStylesElementCreated(stylesElem)
      this._performRefresh()
    }

    attributeChangedCallback(attrName: string, _: any, value: string) {
      const propName = attrNameToPropNameMap.get(attrName.toLowerCase())

      if (propName) {
        ;(this as any)[propName] = propConverters
          .get(propName)!
          .fromStringToProp(value)
      }

      this._performRefresh()
    }

    getAttribute(attrName: string): string | null {
      const propName = attrNameToPropNameMap.get(attrName)

      if (propName) {
        return propConverters
          .get(propName)!
          .fromPropToString(this._properties[propName])
      }

      return super.getAttribute(attrName)
    }

    addEventListener(eventName: string, listener: any) {
      if (eventNameSet.has(eventName)) {
        let listenerSet = this._listenersByEventName.get(eventName)

        if (!listenerSet) {
          listenerSet = new Set()
          this._listenersByEventName.set(eventName, listenerSet)
        }

        listenerSet.add(listener)

        if (listenerSet.size === 1) {
          const propName = eventNameToPropNameMap.get(eventName)!

          this._onPropChange(propName, (ev: any) => {
            const listeners = Array.from(listenerSet!.values())

            setTimeout(() => {
              listeners.forEach((listener) => {
                if (typeof listener === 'function') {
                  listener(ev)
                } else if (
                  listener &&
                  typeof listener.handleEvent === 'function'
                ) {
                  listener.handleEvent(ev)
                }
              }, 0)
            })
          })

          this._performRefresh()
        }
      }

      super.addEventListener.call(this, eventName, listener)
    }

    removeEventListener(eventName: string, listener: any) {
      if (eventNameSet.has(eventName)) {
        const listenerSet = this._listenersByEventName.get(eventName)

        if (listenerSet) {
          listenerSet.delete(listener)

          if (listenerSet.size === 0) {
            const propName = eventNameToPropNameMap.get(eventName)!
            this._onPropChange(propName, undefined)
            this._performRefresh()
          }
        }
      }

      HTMLElement.prototype.removeEventListener.call(this, eventName, listener)
    }
  }

  if (methodNames && methodNames.length > 0) {
    methodNames.forEach((methodName) => {
      // TODO
      ;(baseClass as any).prototype[methodName] = function () {
        // TODO
        const fn = this._getMethodByName(methodName)

        if (!fn) {
          throw new Error(
            `Handler for method "${methodName}" of component "${name}" has not been set`
          )
        }

        return fn.apply(null, arguments)
      }
    })
  }

  return baseClass
}

function isAttr(propConfig: PropConfig) {
  return (
    propConfig.type == String ||
    propConfig.type === Boolean ||
    propConfig.type === Number
  )
}

function isEventPropName(name: string) {
  return name[0] === 'o' && name[1] === 'n' && name[2] >= 'A' && name[2] <= 'Z'
}

function eventPropNameToEventName(eventPropName: string) {
  return eventPropName
    .replace(/^on([A-Z])(.*)/, '$1$2')
    .replace(/([A-Z]+)([A-Z])([a-z0-9])/, '$1-$2$3')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function propNameToAttrName(propName: string) {
  return propName
    .replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}
