import { patch } from '../../internal/vdom'

import h from './h'
export default function defineElement(a, b, c) {
  let tagName, options, main

  if (a && typeof a === 'object' && !b) {
    const { name, init, render, ...rest } = a
    
    tagName = name
    options = rest
    main = render || init
  } else if (typeof a === 'string') {
    tagName = a

    if (typeof b === 'function') {
      options = {}
      main = b
    } else {
      options = { ...b }
      main = c
    }
  } else {
    tagName = a.name
    options = { ...a }
    delete options.name
    main = b
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      checkCustomElementConfig(tagName, options)
    } catch (errorMsg) {
      throw new TypeError(
        'Invalid configuration for custom element '
          + `"${tagName}": ${errorMsg}`)
    }
  }

  customElements.define(tagName,
    generateCustomElementClass(tagName, options, main))
  const ret = h.bind(null, tagName)

  Object.defineProperty(ret, 'js-elements:type', {
    value: tagName
  })

  return ret
}

function generateCustomElementClass(tagName, options, main) {
  const
    propNames = options.props ? keysOf(options.props) : [],
    attrNames = [], // will be filled below
    attrConverters = {}, // dito
    propNameByAttrName = {}, // dito
    attrNameByPropName = {}, // dito
    eventPropNames = propNames.filter(isEventPropName),
    eventNameMappings = getEventNameMappings(eventPropNames) // TODO: this is just an ugly workaround

  const statics = {
    tagName,
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
  }

  connectedCallback() {
    const { main, options, tagName } = this._statics
    let result

    const shadow = options.shadow
      ? options.shadow
      : options.slots && options.slots.length > 0
        ? 'open'
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
      const ctrl = options.props && main.length < 2
        || !options.props && main.length === 0
        ? null
        : {
          getName: () => this._statics.tagName,
          update: runOnceBeforeUpdate => this._update(runOnceBeforeUpdate),
          isRendering: () => this._rendering,
          isInitialized: () => !this._initializing,
          isMounted: () => this._mounted,
          getRoot: () => this._root,
          setMethods: methods => { this._methods = methods },
          afterMount: callback => this._afterMount(callback),
          beforeUpdate: callback => this._beforeUpdate(callback),
          afterUpdate: callback => this._afterUpdate(callback),
          beforeUnmount: callback => this._beforeUnmount(callback)
        }

      if (options.props) {
        if (main.length > 1) {
          this._initializing = true
          result = main(ctrl, this._props)
        } else {
          result = main(this._props)
        }
      } else {
        if (main.length > 0) {
          this._initializing = true
          result = main(ctrl)
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
        const styleId = 'styles::' + tagName

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

      if (content && content.kind === 'virtual-element')  {
        // TODO!!!!!!
        if (!this._root2) {
          this._root2 = document.createElement('span')
          this._root.appendChild(this._root2)
        }

        this._root2 = patch(this._root2, content) // TODO!!!!!!
      } else {
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

// --- tools ---------------------------------------------------------

function isEventPropName(name) {
  return name.match(/^on[A-Z]/)
}

function propNameToAttrName(propName) {
  return propName.replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// --- utility functions ---------------------------------------------

function hasOwnProp(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

function isArray(obj) {
  return obj instanceof Array
}

function keysOf(obj) {
  return Object.keys(obj)
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
  ALLOWED_PROPERTY_TYPES = new Set([Boolean, Number, String, Object, Function, Array, Date]),
  REGEX_TAG_NAME = /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/,
  REGEX_PROP_NAME = /^[a-z][a-zA-Z0-9]*$/,
  REGEX_METHOD_NAME = /^[a-z][a-z0-9]*$/,
  REGEX_SLOT_NAME = /^[a-z][a-z0-9]*$/

function checkCustomElementConfig(name, options) {
  if (typeof name !== 'string' || !name.match(REGEX_TAG_NAME)) {
    throw 'Illegal tag name'
  }
  
  if (options === null) {
    return
  }
  
  const checkParam = (key, pred) => {
    if (!pred(options[key])) {
      throw `Invalid option parameter "${key}"`
    }
  }

  for (const key of keysOf(options)) {
    switch (key) {
    case 'props': {
      const propNames = keysOf(options.props)
      
      if (propNames.length === 0) {
        throw 'Option parameter "props" must not be empty'
      }

      for (const propName of propNames) {
        checkPropConfig(propName, options.props[propName])
      }
      break
    }
    case 'methods':
      checkParam('methods', it => validateStringArray(it, true, REGEX_METHOD_NAME))
      break

    case 'styles':
      checkParam('styles', validateStringArray)
      break

    case 'slots':
      checkParam('slots', it => validateStringArray(it, true, REGEX_SLOT_NAME)
        && it.length === 0 || options.shadow !== 'none')
      break

    case 'shadow':
      checkParam('shadow', it => it !== 'none' && it !== 'close' && it !== 'closed')
      break

    default:
      throw new TypeError(`Illegal option "${key}"`)
    }
  }
}

function checkPropConfig(propName, propConfig) {
  if (!propName.match(REGEX_PROP_NAME)) {
    throw `Illegal prop name "${propName}"`
  }

  const type = propConfig.type

  if (!ALLOWED_PROPERTY_TYPES.has(type)) {
    throw `Illegal parameter "type" for property ${propName}`
  }

  for (const key of keysOf(propConfig)) {
    switch(key) {
    case 'type':
      // already checked
      break

    case 'nullable':
      if (typeof propConfig.nullable !== 'boolean') {
        throw `Illegal parameter "nullable" for property "${propName}"`
      }
      break
  
    case 'required':
      if (typeof propConfig.required !== 'boolean') {
        throw `Illegal parameter "required" for property ${propName}`
      }
      break

    case 'defaultValue': {
      const
        defaultValue = propConfig.defaultValue,
        typeOfDefault = typeof defaultValue

      if (type &&
        (type === Boolean && typeOfDefault !== 'boolean'
          || type === Number && typeOfDefault !== 'number'
          || type === String && typeOfDefault !== 'string'
          || type === Object && typeOfDefault !== 'object'
          || type === Function && typeOfDefault !== 'function'
          || type === Array && !(typeOfDefault instanceof Array)
          || type === Date && !(typeOfDefault instanceof Date))) {
        // TODO!!!
        throw `Illegal parameter "defaultValue" for property ${propName}`
      }
      break
    }
    default:
      throw `Illegal parameter "${key}" for prop "${propName}"`
    }
  }
}

function validateStringArray(arr, unique = false, regex = null) {
  const alreadyUsedValues = {}

  if (!isArray(arr)) {
    return false
  }

  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i]

    if (typeof value !== 'string' || (regex && !value.match(regex))) {
      return false
    }

    if (unique) {
      if (hasOwnProp(alreadyUsedValues, value)) {
        return false
      }

      alreadyUsedValues[value] = true
    }
  }

  return true
}
