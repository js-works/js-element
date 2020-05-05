// external import
import { render as litRender } from 'lit-html'
import { patch } from '../internal/vdom'

import h from './h'
export default function component(a, b, c) {
  let
    componentName,
    options,
    main

  if (typeof a === 'string') {
    componentName = a

    if (typeof b === 'function') {
      options = {}
      main = b
    } else {
      options = { ...b }
      main = c
    }
  } else {
    componentName = a.name
    options = { ...a }
    delete options.name
    main = b
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      if (typeof name !== 'string') {
        throw 'String expected as first argument'
      }

      checkComponentConfig(options)
    } catch (e) {
      throw new TypeError(
        `[component] Invalid configuration for component type "${componentName}": ${e}`)
    }
  }

  customElements.define(componentName,
    generateCustomElementClass(componentName, options, main))
  const ret = (...args) => h(componentName, ...args)

  Object.defineProperty(ret, 'type', {
    value: componentName
  })

  return ret
}

function generateCustomElementClass(componentName, options, main) {
  const
    propNames = options.props ? Object.keys(options.props) : [],
    attrNames = [],
    attrConverters = {},
    propNameByAttrName = {},
    attrNameByPropName = {},
    eventPropNames = propNames.filter(isEventPropName),
    eventNameMappings = getEventNameMappings(eventPropNames)

  const statics = {
    componentName,
    options,
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

  if (options.methods && options.methods.length > 0) {
    options.methods.forEach(methodName => {
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
      propConfig = options.props[propName],
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
    this._initializing = false
    this._rendering = false
    this._methods = null
    this._animationFrameId = 0
    this._runBeforeUpdateTasks = null
    this._afterMountNotifier = null
    this._beforeUpdateNotifier = null
    this._afterUpdateNotifier = null
    this._beforeUnmountNotifier = null

    this._ctrl = {
      getName: () => {
        return this._statics.componentName
      },

      update: runOnceBeforeUpdate => {
        this._update(runOnceBeforeUpdate)
      },

      isRendering: () => {
        return this._rendering
      },
      
      isInitialized: () => {
        return !this._initializing
      },

      isMounted: () => {
        return this._mounted
      },

      getRoot: () => {
        return this._root
      },

      setMethods: methods => {
        this._methods = methods
      },

      afterMount: callback => {
        this._afterMount(callback)
      },

      beforeUpdate: callback => {
        this._beforeUpdate(callback)
      },

      afterUpdate: callback => {
        this._afterUpdate(callback)
      },

      beforeUnmount: callback => {
        this._beforeUnmount(callback)
      }
    }
  }

  connectedCallback() {
    const { main, options, componentName } = this._statics
    let result

    const shadow = options.shadow
      ? options.shadow
      : options.slots && options.slots.length > 0
        ? 'opened'
        : 'none'

    if (shadow !== 'open' && shadow !== 'closed') {
      this._root = this
    } else {
      this.attachShadow({ mode: shadow })
      this.shadowRoot.appendChild(document.createElement('span'))
      this.shadowRoot.appendChild(document.createElement('span'))
      this.shadowRoot.childNodes[0].setAttribute('data-role', 'styles')
      this.shadowRoot.childNodes[1].setAttribute('data-role', 'content')
      this._root = this.shadowRoot.childNodes[1]
    }
  
    try {
      if (options.props) {
        if (main.length > 1) {
          this._initializing = true
          result = main(this._ctrl, this._props)
        } else {
          result = main(this._props)
        }
      } else {
        if (main.length > 0) {
          this._initializing = true
          result = main(this._ctrl)
        } else {
          result = main()
        }
      }
    } finally {
      this._initializing = false
    }

    this._render = typeof result === 'function'
      ? result
      : () => {
        this._render = main
        return result 
      }

    if (options.styles) {
      const css =
        typeof options.styles === 'string'
          ? options.styles
          : options.styles.join('\n\n/* =============== */\n\n')

      if (shadow !== 'open' && shadow !== 'closed') {
        const styleId = 'styles::' + componentName

        if (!document.getElementById(styleId)) {
          const styleElem = document.createElement('style')
          styleElem.id = styleId
          styleElem.appendChild(document.createTextNode(css))
          document.head.appendChild(styleElem)
        }
      } else {
        const styleElem = document.createElement('style')
        styleElem.appendChild(document.createTextNode(css))
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
      
      const content = this._render(this._props)

      if (content && content.processor) {
        litRender(this._render(this._props), this._root)

      } else if (content && content.name)  {
        // TODO!!!!!!
        if (!this._root2) {
          this._root2 = document.createElement('span')
          this._root.appendChild(this._root2)
        }

        this._root2 = patch(this._root2, content) // TODO!!!!!!
      } else {
        console.log(1111, content)
        throw new TypeError('Illegal return value of render function')
      }
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


// --- component options validation -----------------------------------

const
  ALLOWED_COMPONENT_CONFIG_KEYS = ['props', 'validate', 'methods', 'styles', 'slots', 'shadow'],
  ALLOWED_PROPERTY_CONFIG_KEYS = ['type', 'nullable', 'required', 'defaultValue'],
  ALLOWED_PROPERTY_TYPES = [Boolean, Number, String, Object, Function, Array, Date],
  REGEX_PROPERTY_NAME = /^[a-z][a-zA-Z0-9]*$/

function checkComponentConfig(options) {
  const
    props = getParam(options, 'props', 'object'),
    shadow = getParam(options, 'shadow', 'string'),
    slots = getParam(options, 'slots', 'array')
  
  // ignore return value - just check for type
  getParam(options, 'styles', 'array')

  options.validate === null || getParam(options, 'validate', 'function')

  ifInvalidKey(options, ALLOWED_COMPONENT_CONFIG_KEYS, key => {
    throw `Invalid component configuration parameter "${key}"`
  })

  if (shadow && shadow !== 'none' && shadow !== 'open' && shadow !== 'closed') {
    throw 'Component configuration parameter "shadow" must either be "none", "open" or "closed"'
  }

  if (shadow === 'none' && slots && slots.length > 0) {
    throw 'It\'s not allowed to set parameter "shadow" to "none", while the component uses slots'
  }

  if (props) {
    checkProps(props)
  }
}

function getParam(options, paramName, type) {
  let ret

  if (hasOwnProp(options, paramName)) {
    ret = options[paramName]

    if (type === 'array') {
      if (!Array.isArray(ret)) {
        throw `Parameter "${paramName}" must be an array`
      }
    } else if (type && typeof ret !== type) {
      throw `Parameter "${paramName}" must be of type ${type}`
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
