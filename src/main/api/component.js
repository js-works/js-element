// external import
import { render as litRender } from 'lit-html'

// internal imports
import hasOwnProp from '../internal/hasOwnProp'
import checkComponentConfig from '../internal/checkComponentConfig'
import createNotifier from '../internal/createNotifier'
export default function component(name, config) {
  if (process.env.NODE_ENV === 'development') {
    try {
      if (typeof name !== 'string') {
        throw 'String expected as first argument'
      }

      if (typeof config !== 'object') {
        throw 'Object expected as second argument'
      }

      checkComponentConfig(config)
    } catch (e) {
      throw new TypeError(`[component] ${e}`)
    }
  }

  customElements.define(name, generateCustomElementClass(config))
}

function generateCustomElementClass(config) {
  const
    propNames = config.props ? Object.keys(config.props) : [],
    attrNames = [],
    attrConverters = {},
    propNameByAttrName = {},
    attrNameByPropName = {} 

  let
    defaultProps = null 

  const CustomElement = class extends BaseElement {
    static get observedAttributes() {
      return attrNames
    }

    constructor() {
      super()
      this._props = defaultProps ? Object.assign({}, defaultProps) : {}
      this._unmount = null // will be set in method connectedCallback
      this._methods = null
      this._listenersByEventName

      if (config.methods && config.methods.length > 0) {
        this._methods = null

        config.methods.forEach(method => {
          this[method] = (...args) => this._methods[method](...args)
        })
      }
    }

    getAttribute(attrName) {
      const
        propName = attrNameByPropName[attrName],
        val = this._props[propName],
        converter = attrConverters[attrName]

      return (val === undefined || val === null)
        ? val
        : (converter ? converter.toString(val) : val.toString())
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      const
        propName = propNameByAttrName[attrName],
        converter = attrConverters[attrName]

      this[propName] = converter ? converter.fromString(newValue) : newValue
    }

    connectedCallback() {
      let
        mounted = false,
        isRendering = true,
        root,
        render,
        update,
        afterMountNotifier,
        beforeUpdateNotifier,
        afterUpdateNotifier,
        beforeUnmountNotifier

      if (config.shadow === 'open' || config.shadow === 'closed') {
        this.attachShadow({ mode: config.shadow })
        root = this.shadowRoot
      } else {
        root = this
      }

      if (config.render) {
        render = config.render.bind(null, this._props)
      } else {
        afterMountNotifier = createNotifier()
        beforeUpdateNotifier = createNotifier()
        afterUpdateNotifier = createNotifier()
        beforeUnmountNotifier = createNotifier()

        const ctrl = {
          isMounted: () => mounted,
          isRendering: () => isRendering,
          update: () => update && update(),
          afterMount: afterMountNotifier.subscribe,
          beforeUpdate: beforeUpdateNotifier.subscribe,
          afterUpdate: afterUpdateNotifier.subscribe,
          beforeUnmount: beforeUnmountNotifier.subscribe
        }

        render = config.main(ctrl, this._props, methods => {
          this._methods = methods
        })
      }


      const { update: forceUpdate, unmount } = mountComponent(
        root,
        render,

        () => {
          isRendering = false
          afterMountNotifier && afterMountNotifier.notify()
        },
        
        () => {
          isRendering = true
          this._adjustEventProps() 
          beforeUpdateNotifier && beforeUpdateNotifier.notify()
        },

        () => {
          isRendering = false
          afterUpdateNotifier && afterUpdateNotifier.notify()
        },

        beforeUnmountNotifier && beforeUnmountNotifier.notify
      )

      mounted = true
      update = forceUpdate
      this._unmount = unmount
    }

    disconnectedCallback() {
      this._unmount()
    }

    addEventListener(...args) {
      console.log(1111, ...args)
    }
  }

  propNames.filter(it => !isEventPropName(it)).forEach(propName => {
    const
      propConfig = config.props[propName],
      type = propConfig.type

    if (type === Boolean || type === Number || type === String) {
      const attrName = propNameToAttrName(propName)
      attrNames.push(attrName)

      if (type === Boolean) {
        attrConverters[attrName] = booleanConverter
      } else if (type === Number) {
        attrConverters[attrName] = numberConverter
      }

      propNameByAttrName[attrName] = propName
      attrNameByPropName[propName] = attrName
    }

    if (hasOwnProp(propConfig, 'defaultValue')) {
      defaultProps = defaultProps || {}
      defaultProps[propName] = propConfig.defaultValue // TODO!
    }

    Object.defineProperty(CustomElement.prototype, propName, {
      get() {
        return this._props[propName]
      },

      set(value) {
        this._props[propName] = value

        if (this._initialized) {
          this._update()
        }
      }
    })
  })

  addEventFeatures(CustomElement, config)

  return CustomElement
}

function addEventFeatures(CustomElement, config) {
  const
    self = this,
    proto = CustomElement.prototype,
    propNames = !config.props ? [] : Object.keys(config.props),
    eventPropNames = propNames.filter(isEventPropName),
    eventNames = eventPropNames.map(it => toKebabCase(it.substr(2))),
    eventNameMappings = getEventNameMappings(eventNames),
    origAddEventListenerFunc = proto.addEventListener,
    origRemoveEventListenerFunc = proto.removeEventListener,
    origDispatchEventFunc = proto.dispatchEvent

  eventPropNames.forEach(eventPropName => {
    const eventName = eventNameMappings[eventPropName.substr(2)]

    Object.defineProperty(proto, eventPropName, {
      set: callback => { self[`_${eventName}_callback`] = callback },
      get: () => self[`_${eventName}_callback`]
    })
  })

  proto.addEventListener = function (eventName, callback) {
    const normalizedEventName =
      hasOwnProp(eventNameMappings, eventName)
        ? eventNameMappings[eventName]
        : null

    if (!normalizedEventName) {
      origAddEventListenerFunc.call(this, eventName, callback)
      return
    }

    this._listenersByEventName[eventName] = self._listenersByEventName[eventName] || new Set()
    this._listenersByEventName[eventName].add(callback)
    origAddEventListenerFunc.call(this, normalizedEventName, callback)
  }

  proto.removeEventListener = function (eventName, callback) {
    const normalizedEventName =
      hasOwnProp(eventNameMappings, eventName)
        ? eventNameMappings[eventName]
        : null
    
    if (!normalizedEventName) {
      origRemoveEventListenerFunc.call(this, eventName, callback)
      return
    }

    if (!this._listenersByEventName[eventName]) {
      return
    }

    this._listenersByEventName[eventName].remove(callback)
    origRemoveEventListenerFunc.call(this, normalizedEventName, callback)
  }

  proto.dispatchEvent = function (event) {
    const
      callback = this[`_${event.type}_callback`],
      listeners = this._listenersByEventName[event.type]

    if (callback && (!listeners || !listeners.has(callback))) {
      callback(event)
    }

    return origDispatchEventFunc.apply(this, arguments)
  }

  proto._adjustEventProps = function () {
    eventPropNames.forEach(eventPropName => {
      const
        eventName = eventNameMappings[eventPropName.substr(2)],
        listeners = this._listenersByEventName[eventName],
        hasAnyListeners = this[eventPropName] || (listeners && listeners.size > 0)

      if (hasAnyListeners) {
        if (!this._props[eventPropName]) {
          this._props[eventPropName] = event => this.dispatchEvent(event)
        }
      } else {
        delete this._props[eventPropName]
      }
    })
  }
}

function toKebabCase(string) {
  return string
    .replace(/^on([A-Z])(.*)/, '$1$2')
    .replace(/([A-Z]+)([A-Z])([a-z0-9])/, '$1-$2$3')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function getEventNameMappings(eventNames) {
  const ret = {}

  eventNames
    .forEach(eventName => {
      ret[eventName] = eventName
      ret[eventName.toLowerCase()] = eventName
      ret[eventName.substr(2)] = eventName
    })

  return ret
}

class BaseElement extends HTMLElement {
  constructor() {
    super()
  }
}

function isEventPropName(name) {
  return name.match(/^on[A-Z]/)
}

function propNameToAttrName(propName) {
  return propName.replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

const
  booleanConverter = {
    toString: value => value === true ? 'true' : 'false',
    fromString: value => value === 'true' ? true : false
  },

  numberConverter = {
    toString: String,
    fromString: Number
  }

function mountComponent(
  target,
  getContent,
  doAfterMount,
  doBeforeUpdate,
  doAfterUpdate, 
  doBeforeUnmount
) {
  let mounted = false

  const
    update = () => {
      mounted && doBeforeUpdate && doBeforeUpdate()
      litRender(getContent(), target)
      mounted && doAfterUpdate && doAfterUpdate()
    },

    unmount = () => {
      doBeforeUnmount && doBeforeUnmount()
      target.innerHtml = ''
    }

  update()
  mounted = true
  doAfterMount && doAfterMount()

  return { update, unmount }
}
