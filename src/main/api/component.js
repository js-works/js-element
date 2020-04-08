// external import
import { render as litRender } from 'lit-html'

// internal imports
import globals from '../internal/globals'
import hasOwnProp from '../internal/hasOwnProp'
import checkComponentConfig from '../internal/checkComponentConfig'
import registerCustomElement from '../internal/registerCustomElement'
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

  if ((!config.shadow || config.shadow === 'none') && config.styles) {
    const styles = Array.isArray(config.styles) ? config.styles : [config.styles]
    
    styles.forEach(item => {
      const id = 'styles::' + item.id

      if (!document.getElementById(id)) {
        const styleElem = item.styleElement.cloneNode(true)

        styleElem.setAttribute('id', id)
        document.head.appendChild(styleElem)
      }
    })
  }

  registerCustomElement(componentName,
    generateCustomElementClass(componentName, config, main))
}

function generateCustomElementClass(componentName, config, main) {
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
        this.shadowRoot.appendChild(document.createElement('span'))
        this.shadowRoot.appendChild(document.createElement('span'))
        this.shadowRoot.childNodes[0].setAttribute('data-role', 'styles')
        this.shadowRoot.childNodes[1].setAttribute('data-role', 'content')
        root = this.shadowRoot.childNodes[1]

        if (config.styles) {
          const styles =
            !config.styles
              ? []
              : Array.isArray(config.styles) 
                ? config.styles
                : [config.styles]
        
          styles.forEach(item => {
            this.shadowRoot.firstChild.appendChild(
              item.styleElement.cloneNode(true))
          })
        }
      } else {
        root = this
      }

      this._adjustEventProps() 
      afterMountNotifier = createNotifier()
      beforeUpdateNotifier = createNotifier()
      afterUpdateNotifier = createNotifier()
      beforeUnmountNotifier = createNotifier()

      const ctrl = {
        getRoot: () => root,
        isMounted: () => mounted,
        isRendering: () => isRendering,
        
        update: runOnceBeforeUpdate => {
          update && update(runOnceBeforeUpdate)
        },

        setMethods: methods => this._methods = methods,
        afterMount: afterMountNotifier.subscribe,
        beforeUpdate: beforeUpdateNotifier.subscribe,
        afterUpdate: afterUpdateNotifier.subscribe,
        beforeUnmount: beforeUnmountNotifier.subscribe
      }

      try {
        let firstTime = true

        render = () => {
          if (firstTime) {
            globals.currentCtrl = ctrl
            firstTime = false
            const result = main(this._props)

            if (typeof result !== 'function') {
              render = main

              return result
            } else {
              render = result

              return render() 
            }
          } else {
            return render(this._props)
          }
        }
      } finally {
        globals.currentCtrl = null
      }

      if (config.validate) {
        const oldRender = render

        render = () => {
          const result = config.validate(this._props)

          if (result) {
            throw new TypeError('Incorrect props for component '
              + `of type "${componentName}": ${result.message}`)
          }

          return oldRender()
        }
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
    proto = CustomElement.prototype,
    propNames = !config.props ? [] : Object.keys(config.props),
    eventPropNames = propNames.filter(isEventPropName),
    eventNameMappings = getEventNameMappings(eventPropNames),
    origAddEventListenerFunc = proto.addEventListener,
    origRemoveEventListenerFunc = proto.removeEventListener

  proto.addEventListener = function (eventName, callback) {
    const normalizedEventName =
      hasOwnProp(eventNameMappings, eventName)
        ? eventNameMappings[eventName]
        : null

    if (!normalizedEventName) {
      origAddEventListenerFunc.call(this, eventName, callback)
      return
    }

    this._listenersByEventName = this._listenersByEventName || {}
    this._listenersByEventName[normalizedEventName] = this._listenersByEventName[normalizedEventName] || new Set()
    this._listenersByEventName[normalizedEventName].add(callback)
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

  proto._adjustEventProps = function () {
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
    toString: value => value === true ? '' : null,
    fromString: value => typeof value === 'string' ? true : false
  },

  numberConverter = {
    toString: String,
    fromString: Number
  }

function mountComponent(
  root,
  getContent,
  doAfterMount,
  doBeforeUpdate,
  doAfterUpdate, 
  doBeforeUnmount
) {
  let
    mounted = false,
    updateForced = false

  const
    runOnceBeforeUpdateTasks = [],

    updateSync = () => {
      mounted && doBeforeUpdate && doBeforeUpdate()
      
      if (mounted && runOnceBeforeUpdateTasks.length > 0) {
        runOnceBeforeUpdateTasks.forEach(task => task())
        runOnceBeforeUpdateTasks.length = 0 // TODO!!!!!
      }

      litRender(getContent(), root)
      mounted && doAfterUpdate && doAfterUpdate()
    },

    updateAsync = runOnceBeforeUpdateTask => {
      runOnceBeforeUpdateTask
        && runOnceBeforeUpdateTasks.push(runOnceBeforeUpdateTask)

      if (!updateForced) {
        updateForced = true

        requestAnimationFrame(() => {
          updateForced = false

          updateSync()
        })
      }
    },

    unmount = () => {
      doBeforeUnmount && doBeforeUnmount()
      root.innerHtml = ''
    }

  updateSync()
  mounted = true
  doAfterMount && doAfterMount()

  return { update: updateAsync, unmount }
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
