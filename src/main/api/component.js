// external import
import { render as litRender } from 'lit-html'

// internal imports
import globals from '../internal/globals'
export default function component(componentName, a, b) {
  const
    config = typeof a === 'function' ? {} : a,
    main = b ? b : a

  if (process.env.NODE_ENV === 'development') {
    try {
      if (typeof name !== 'string') {
        throw 'String expected as first argument'
      }

      checkComponentConfig(config)
    } catch (e) {
      throw new TypeError(
        `[component] Invalid configuration for component type "${componentName}": ${e}`)
    }
  }

  customElements.define(componentName,
    generateCustomElementClass(componentName, config, main))
}

function generateCustomElementClass(componentName, config, main) {
  const
    propNames = config.props ? Object.keys(config.props) : [],
    attrNames = [],
    attrConverters = {},
    propNameByAttrName = {},
    attrNameByPropName = {},
    eventPropNames = propNames.filter(isEventPropName),
    eventNameMappings = getEventNameMappings(eventPropNames)

  const statics = {
    componentName,
    config,
    main,
    attrConverters,
    propNameByAttrName,
    attrNameByPropName,
    eventPropNames,
    eventNameMappings,
    defaultProps: null
  }
  
  class CustomElement extends BaseElement {
    constructor() {
      super(statics)
    }
  }

  CustomElement.observedAttributes = attrNames

  if (config.methods && config.methods.length > 0) {
    config.methods.forEach(methodName => {
      CustomElement.prototype[methodName] = function () {
        const fn = this._methods && this._methods[methodName]

        if (!fn) {
          throw new Error(`Handler for method "${methodName}" of component "${name}" has not been set`)
        }

        return fn.apply(null, arguments)
      }
    })
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
      statics.defaultProps || (statics.defaultProps = {})
      statics.defaultProps[propName] = propConfig.defaultValue // TODO!
    }

    Object.defineProperty(CustomElement.prototype, propName, {
      get() {
        return this._props[propName]
      },

      set(value) {
        this._props[propName] = value
        
        if (this._mounted) {
          this._update()
        }
      }
    })
  })

  return CustomElement
}

function toKebabCase(string) {
  return string
    .replace(/^on([A-Z])(.*)/, '$1$2') // TODO
    .replace(/([A-Z]+)([A-Z])([a-z0-9])/, '$1-$2$3')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function getEventNameMappings(eventPropNames) {
  const ret = {}

  eventPropNames
    .forEach(eventPropName => {
      const
        name = eventPropName.substr(2),
        eventName = toKebabCase(name)

      ret[eventName] = eventName
      ret[name] = eventName
      ret[name.toLowerCase()] = eventName
      ret[name[0].toLowerCase() + name.substr(1)] = eventName
    })

  return ret
}

class BaseElement extends HTMLElement {
  constructor(statics) {
    super()
    this._statics = statics
    this._props = statics.defaultProps ? Object.assign({}, statics.defaultProps) : {}
    this._root = undefined
    this._mounted = false
    this._rendering = false
    this._methods = null
    this._animationFrameId = 0
    this._runBeforeUpdateTasks = null
    this._afterMountNotifier = null
    this._beforeUpdateNotifier = null
    this._afterUpdateNotifier = null
    this._beforeUnmountNotifier = null
  }

  connectedCallback() {
    const { main, config, componentName } = this._statics
    let result

    if (config.shadow !== 'open' && config.shadow !== 'closed') {
      this._root = this
    } else {
      this.attachShadow({ mode: config.shadow })
      this.shadowRoot.appendChild(document.createElement('span'))
      this.shadowRoot.appendChild(document.createElement('span'))
      this.shadowRoot.childNodes[0].setAttribute('data-role', 'styles')
      this.shadowRoot.childNodes[1].setAttribute('data-role', 'content')
      this._root = this.shadowRoot.childNodes[1]
    }
  
    try {
      globals.currentComponent = this

      if (config.methods) {
        const setMethods = methods => { this._methods = methods }
        
        if (config.props) {
          result = main(this._props, setMethods)
        } else {
          result = main(setMethods)
        }
      } else {
        if (config.props) {
          result = main(this._props)
        } else {
          result = main()
        }
      }
    } finally {
      globals.currentComponent = null
    }

    this._render = typeof result === 'function'
      ? result
      : () => {
        this._render = main
        return result 
      }

    if (config.styles) {
      if (config.shadow !== 'open' && config.shadow !== 'closed') {
        const styleId = 'styles::' + componentName

        if (!document.getElementById(styleId)) {
          const styleElem = document.createElement('style')
          styleElem.id = styleId
          styleElem.appendChild(document.createTextNode(config.styles))
          document.head.appendChild(styleElem)
        }
      } else {
        const styleElem = document.createElement('style')
        styleElem.appendChild(document.createTextNode(config.styles))
        this.shadowRoot.childNodes[0].appendChild(styleElem)
      }
    }

    this._refresh()
  }

  disconnectedCallback() {
    this._beforeUnmountNotifier && this._beforeUnmountNotifier.notify()
    this._root.innerHTML = ''
  }
  getAttribute(attrName) {
    const
      statics = this._statics,
      attrNameByPropName = statics.attrNameByPropName,
      attrConverters = statics.attrConverters,
      propName = attrNameByPropName[attrName],
      val = this._props[propName],
      converter = attrConverters[attrName]

    return (val === undefined || val === null)
      ? val
      : (converter ? converter.toString(val) : val.toString())
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    const
      statics = this._statics,
      propNameByAttrName = statics.propNameByAttrName,
      attrConverters = statics.attrConverters,
      propName = propNameByAttrName[attrName],
      converter = attrConverters[attrName]

    this[propName] = converter ? converter.fromString(newValue) : newValue
  }
  addEventListener(eventName, callback) {
    const
      eventNameMappings = this._statics.eventNameMappings,
      normalizedEventName =
        hasOwnProp(eventNameMappings, eventName)
          ? eventNameMappings[eventName]
          : null

    if (!normalizedEventName) {
      HTMLElement.prototype.addEventListener.call(this, eventName, callback)
      return
    }

    this._listenersByEventName = this._listenersByEventName || {}
    this._listenersByEventName[normalizedEventName] = this._listenersByEventName[normalizedEventName] || new Set()
    this._listenersByEventName[normalizedEventName].add(callback)
    HTMLElement.prototype.addEventListener.call(this, normalizedEventName, callback)
  }
  removeEventListener(eventName, callback) {
    const
      eventNameMappings = this._statics.eventNameMappings,
      normalizedEventName =
        hasOwnProp(eventNameMappings, eventName)
          ? eventNameMappings[eventName]
          : null
    
    if (!normalizedEventName) {
      HTMLElement.prototype.removeEventListener.call(this, eventName, callback)
      return
    }

    if (!this._listenersByEventName[eventName]) {
      return
    }

    this._listenersByEventName[eventName].remove(callback)
    HTMLElement.prototype.removeEventListener.call(this, normalizedEventName, callback)
  }

  _refresh() {
    this._mounted && this._beforeUpdateNotifier && this._beforeUpdateNotifier.notify()

    if (this._mounted && this._runOnceBeforeUpdateTasks && this._runOnceBeforeUpdateTasks.length) {
      this._runOnceBeforeUpdateTasks.forEach(task => task())
      this._runOnceBeforeUpdateTasks.length = 0 // TODO
    }

    try {
      this._rendering = true
      this._adjustEventProps()
      litRender(this._render(this._props), this._root)
    } finally {
      this._rendering = false 
    }

    if (!this._mounted) {
      this._mounted = true
      this._afterMountNotifier && this._afterMountNotifier.notify()
    } else {
      this._afterUpdateNotifier && this._afterUpdateNotifier.notify()
    }
  }
  _update(runOnceBeforeUpdate) {
    runOnceBeforeUpdate
      && (this._runOnceBeforeUpdateTasks || (this._runOnceBeforeUpdateTasks = []))
      && this._runOnceBeforeUpdateTasks.push(runOnceBeforeUpdate)

    if (this._mounted && !this._animationFrameId) {
      this._animationFrameId = requestAnimationFrame(() => {
        this._animationFrameId = 0
        this._refresh()
      })
    }
  }

  _afterMount(callback) {
    this._afterMountNotifier = createNotifier()
    this._afterMount = this._afterMountNotifier.subscribe
    this._afterMount(callback)
  }

  _beforeUpdate(callback) {
    this._beforeUpdateNotifier = createNotifier()
    this._beforeUpdate = this._beforeUpdateNotifier.subscribe
    this._beforeUpdate(callback)
  }
  
  _afterUpdate(callback) {
    this._afterUpdateNotifier = createNotifier()
    this._afterUpdate = this._afterUpdateNotifier.subscribe
    this._afterUpdate(callback)
  }

  _beforeUnmount(callback) {
    this._beforeUnmountNotifier = createNotifier()
    this._beforeUnmount = this._beforeUnmountNotifier.subscribe
    this._beforeUnmount(callback)
  }
  _adjustEventProps() {
    const
      eventPropNames = this._statics.eventPropNames,
      eventNameMappings = this._statics.eventNameMappings

    eventPropNames.forEach(eventPropName => {
      const
        eventName = eventNameMappings[eventPropName.substr(2)],
        listeners = this._listenersByEventName && this._listenersByEventName[eventName],
        hasAnyListeners = listeners && listeners.size > 0

      if (hasAnyListeners) {
        if (!this._props[eventPropName]) {
          this._props[eventPropName] = event => {
            this.dispatchEvent(event)
          }
        }
      } else {
        delete this._props[eventPropName]
      }
    })
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

function createNotifier() {
  const subscribers = []

  return {
    subscribe(subscriber) {
      subscribers.push(subscriber)
    },

    notify() {
      subscribers.forEach(subscriber => subscriber())
    }
  }
}

function hasOwnProp(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

// --- converters ----------------------------------------------------

const
  booleanConverter = {
    toString: value => value === true ? '' : null,
    fromString: value => typeof value === 'string' ? true : false
  },

  numberConverter = {
    toString: String,
    fromString: Number
  }


// --- component config validation -----------------------------------

const
  ALLOWED_COMPONENT_CONFIG_KEYS = ['props', 'validate', 'methods', 'styles', 'shadow'],
  ALLOWED_PROPERTY_CONFIG_KEYS = ['type', 'nullable', 'required', 'defaultValue'],
  ALLOWED_PROPERTY_TYPES = [Boolean, Number, String, Object, Function, Array, Date],
  REGEX_PROPERTY_NAME = /^[a-z][a-zA-Z0-9]*$/

function checkComponentConfig(config) {
  const
    props = getParam(config, 'props', 'object'),
    shadow = getParam(config, 'shadow', 'string')
  
  // ignore return value - just check for type 'string'
  getParam(config, 'styles', 'string')

  config.validate === null || getParam(config, 'validate', 'function')

  ifInvalidKey(config, ALLOWED_COMPONENT_CONFIG_KEYS, key => {
    throw `Invalid component configuration parameter "${key}"`
  })

  if (shadow && shadow !== 'none' && shadow !== 'open' && shadow !== 'closed') {
    throw 'Component configuration parameter "shadow" must either be "none", "open" or "closed"'
  }

  if (props) {
    checkProps(props)
  }
}

function getParam(config, paramName, type) {
  let ret

  if (hasOwnProp(config, paramName)) {
    ret = config[paramName]

    if (type && typeof ret !== type) {
      throw `Illegal value for parameter "${paramName}"`
    }
  }

  return ret
}

function ifInvalidKey(obj, allowedKeys, fn) {
  for (const key in obj) {
    if (hasOwnProp(obj, key)) {
      if (allowedKeys.indexOf(key) === -1) {
        fn(key)
        break
      }
    }
  }
}

function checkProps(props) {
  for (const key in props) {
    if (hasOwnProp(props, key)) {
      if (!REGEX_PROPERTY_NAME.test(key)) {
        throw `Illegal property name "${key}"`
      }

      checkPropertyConfig(key, props[key])
    }
  }
}

function checkPropertyConfig(propName, propConfig) {
  ifInvalidKey(propConfig, ALLOWED_PROPERTY_CONFIG_KEYS, key => {
    throw `Invalid parameter "${key}" for property "${propName}"`
  })

  const
    type = getParam(propConfig, 'type', 'function'),
    nullable = getParam(propConfig, 'nullable', 'boolean'),
    required = getParam(propConfig, 'required', 'boolean')

  if (required === true && hasOwnProp(propConfig, 'defaultValue')) {
    throw `Unexpected parameter "defaultValue" from property "${propName}"`
  }

  if (type && ALLOWED_PROPERTY_TYPES.indexOf(type) === -1) {
    throw `Illegal parameter "type" for property "${propName}"`
  }

  if (nullable && !type) {
    throw `Unexpected parameter "nullable" for property "${propName}"`
  }
}
