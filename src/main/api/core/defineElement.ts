//import { patch } from '../../internal/vdom'
import { render } from '../../internal/platform'
import h from './h'
import isElement from './isElement'
import Props from '../#types/Props'
import Methods from '../#types/Methods'
import Ctrl from '../#types/Ctrl'
import VNode from '../#types/VNode'
import Component from '../#types/Component'

export default defineElement

type PropConfig<T> = {
  type?: any,
  nullable?: null extends T ? true : never,
  required?: undefined extends T ? never : true,
  defaultValue?: undefined extends T ? Exclude<T, undefined> : never
}

type PropsConfig<P extends Props> = {
  [K in keyof P]: PropConfig<P[K]>
}

type ValidPropsConfig<P extends Props, PC extends PropsConfig<P>> =
  keyof PC extends keyof P
    ? (keyof P) extends (keyof PC)
    ?  1 extends { [K in keyof PC]: {} extends Omit<PC[K], keyof PropConfig<any>> ? 0 : 1 }[keyof PC]
    ?  never
    : PC
    : never
    : never


type DefaultedProps<P extends Props, PC extends PropsConfig<P>> = P & {
  [K in keyof PC]: PC[K] extends { defaultValue: infer D } ? D : unknown
}

type ConfigStateless<P extends Props, PC extends PropsConfig<P>> = {
  name: string,
  props?: ValidPropsConfig<P, PC>,
  styles?: string[],
  slots?: string[],
  render(props: DefaultedProps<P, PC>): VNode,
}

type ConfigStateful<P extends Props, PC extends PropsConfig<P>> = {
  name: string,
  props?: ValidPropsConfig<P, PC>,
  styles?: string[],
  slots?: string[],
  
  init(
    c: Ctrl<DefaultedProps<P, PC>>,
    props: DefaultedProps<P, PC>
  ): (props: DefaultedProps<P, PC>) => VNode
}

type ConfigStatefulWithMethods<P extends Props, M extends Methods, PC extends PropsConfig<P>> = {
  name: string,
  methods: (keyof M)[],
  props?: ValidPropsConfig<P, PC>,
  styles?: string[],
  slots?: string[],

  init(
    c: Ctrl<DefaultedProps<P, PC>, M>,
    props: DefaultedProps<P, PC>
  ): (props: DefaultedProps<P, PC>) => VNode
}

function defineElement<P extends Props, M extends Methods, PC extends PropsConfig<P>>(
  config: ConfigStatefulWithMethods<P, M, PC>
): Component<P, M>

function defineElement<P extends Props, M extends Methods, PC extends PropsConfig<P>>(
  config: Omit<ConfigStatefulWithMethods<P, M, PC>, 'init'>,
  init: ConfigStatefulWithMethods<P, M, PC>['init']
): Component<P, M>

function defineElement<P extends Props, M extends Methods, PC extends PropsConfig<P>>(
  name: string,
  options: Omit<ConfigStatefulWithMethods<P, M, PC>, 'name' | 'init'>,
  init: ConfigStatefulWithMethods<P, M, PC>['init']
): Component<P, M>

function defineElement<P extends Props, PC extends PropsConfig<P>>(
  config: ConfigStateful<P, PC>
): Component<P>

function defineElement<P extends Props>(
  name: string,
  init: ConfigStateful<P, never>['init']
): Component<P>

function defineElement<P extends Props, PC extends PropsConfig<P>>(
  config: Omit<ConfigStateful<P, PC>, 'init'>,
  init: ConfigStateful<P, PC>['init']
): Component<P>

function defineElement<P extends Props, PC extends PropsConfig<P>>(
  name: string,
  config: Omit<ConfigStateful<P, PC>, 'name' | 'init'>,
  init: ConfigStateful<P, PC>['init']
): Component<P>

function defineElement<P extends Props>(
  name: string,
  init: ConfigStateful<P, never>['init']
): Component<P>

function defineElement<P extends Props, PC extends PropsConfig<P>> (
  config: ConfigStateless<P, PC>
): Component<P>

function defineElement<P extends Props, PC extends PropsConfig<P>>(
  config: Omit<ConfigStateless<P, PC>, 'render'>,
  render: ConfigStateless<P, PC>['render']
): Component<P>

function defineElement<P extends Props, PC extends PropsConfig<P>>(
  name: string,
  options: Omit<ConfigStateless<P, PC>, 'name' | 'render'>,
  render: ConfigStateless<P, PC>['render']
): Component<P>

function defineElement<P extends Props>(
  name: string,
  render: ConfigStateless<P, never>['render']
): Component<P>

function defineElement(a: any, b?: any, c?: any) { // TODO
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

  if (process.env.NODE_ENV === 'development' as any) {
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

function generateCustomElementClass(tagName: any, options: any, main: any) { // TODO
  const
    propNames = options.props ? keysOf(options.props) : [],
    attrNames: any = [], // will be filled below // TODO
    attrConverters = {}, // dito
    propNameByAttrName = {}, // dito
    attrNameByPropName = {}, // dito
    eventPropNames = propNames.filter(isEventPropName),
    eventNames = new Set(eventPropNames.map(it => eventPropNameToEventName(it)))

  const statics: any = { // TODO
    tagName,
    options,
    main,
    attrConverters,
    propNameByAttrName,
    attrNameByPropName,
    eventPropNames,
    eventNames,
    defaultProps: null
  }
  
  class CustomElement extends BaseElement {
    constructor() {
      super(statics)
    }
  }

  (CustomElement as any).observedAttributes = attrNames // TODO

  if (options.methods && options.methods.length > 0) {
    options.methods.forEach((methodName: any) => { // TODO
      (CustomElement as any).prototype[methodName] = function () { // TODO
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
        statics.attrConverters[attrName] = booleanConverter
      } else if (type === Number) {
        statics.attrConverters[attrName] = numberConverter
      }

      statics.propNameByAttrName[attrName] = propName
      statics.attrNameByPropName[propName] = attrName
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

function toKebabCase(s: string) {
  return s
    .replace(/^on([A-Z])(.*)/, '$1$2') // TODO
    .replace(/([A-Z]+)([A-Z])([a-z0-9])/, '$1-$2$3')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

class BaseElement extends HTMLElement {
  constructor(statics: any) { // TODO
    super()
    const self: any = this // TODO
    self._statics = statics
    self._props = statics.defaultProps ? Object.assign({}, statics.defaultProps) : {}
    self._root = undefined
    self._mounted = false
    self._initializing = false
    self._rendering = false
    self._methods = null
    self._animationFrameId = 0
    self._runBeforeUpdateTasks = null
    self._afterMountNotifier = null
    self._beforeUpdateNotifier = null
    self._afterUpdateNotifier = null
    self._beforeUnmountNotifier = null
  
    statics.eventPropNames.forEach((eventPropName: string) => {
      const eventName = eventPropNameToEventName(eventPropName)

      Object.defineProperty(self._props, eventPropName, {
        get() {
          const listenerSet = self._listenersByEventName && self._listenersByEventName[eventName]

          return !listenerSet || listenerSet.size === 0
            ? undefined
            : (ev: any) => self.dispatchEvent(ev)
        }
      })
    })
  }

  connectedCallback(this: any) { // TODO
    const { main, options, tagName } = (this as any)._statics // TODO
    let result: any // TODO

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
          getProps: () => this._props,
          update: (runOnceBeforeUpdate: () => void) => this._update(runOnceBeforeUpdate),
          isRendering: () => this._rendering,
          isInitialized: () => !this._initializing,
          isMounted: () => this._mounted,
          getRoot: () => this._root,
          setMethods: (methods: any) => { this._methods = methods }, // TODO
          afterMount: (callback: () => void) => this._afterMount(callback),
          beforeUpdate: (callback: () => void) => this._beforeUpdate(callback),
          afterUpdate: (callback: () => void) => this._afterUpdate(callback),
          beforeUnmount: (callback: () => void) => this._beforeUnmount(callback)
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

  disconnectedCallback(this: any) { // TODO
    this._beforeUnmountNotifier && this._beforeUnmountNotifier.notify()
    this._root.innerHTML = ''
  }

  getAttribute(this: any, attrName: string) { // TODO
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

  attributeChangedCallback(this: any,attrName: string, oldValue: any, newValue: any) { // TODO
    const
      statics = this._statics,
      propNameByAttrName = statics.propNameByAttrName,
      attrConverters = statics.attrConverters,
      propName = propNameByAttrName[attrName],
      converter = attrConverters[attrName]

    this[propName] = converter ? converter.fromString(newValue) : newValue
  }

  addEventListener(this: any, eventName: string, callback: any) { // TODO
    if (!this._statics.eventNames.has(eventName)) {
      HTMLElement.prototype.addEventListener.call(this, eventName, callback)
      return
    }

    this._listenersByEventName = this._listenersByEventName || {}
    this._listenersByEventName[eventName] = this._listenersByEventName[eventName] || new Set()
    this._listenersByEventName[eventName].add(callback)
    HTMLElement.prototype.addEventListener.call(this, eventName, callback)
  }

  removeEventListener(this: any, eventName: string, callback: any) { // TODO
    if (!this._listenersByEventName[eventName]) {
      HTMLElement.prototype.removeEventListener.call(this, eventName, callback)
      return
    }

    this._listenersByEventName[eventName].remove(callback)
    HTMLElement.prototype.removeEventListener.call(this, eventName, callback)
  }

  _refresh(this: any) { // TODO
    this._mounted && this._beforeUpdateNotifier && this._beforeUpdateNotifier.notify()

    if (this._mounted && this._runOnceBeforeUpdateTasks && this._runOnceBeforeUpdateTasks.length) {
      this._runOnceBeforeUpdateTasks.forEach((task: () => void) => task())
      this._runOnceBeforeUpdateTasks.length = 0 // TODO
    }

    try {
      this._rendering = true

      const content = this._render(this._props)

      if (isElement(content))  {
        // TODO!!!!!!
        if (!this._root2) {
          this._root2 = document.createElement('span')
          this._root.appendChild(this._root2)
        }

        //this._root2 = patch(this._root2, content) // TODO!!!!!!
        let result = (render as any)(content, this._root2) // TODO!!!!!!

        if (result) {
          this._root2 = result
        } 
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
  _update(this: any, runOnceBeforeUpdate: () => void) { // TODO
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

  _afterMount(this: any, callback: () => void) { // TODO
    this._afterMountNotifier = createNotifier()
    this._afterMount = this._afterMountNotifier.subscribe
    this._afterMount(callback)
  }

  _beforeUpdate(this: any, callback: () => void) { // TODO
    this._beforeUpdateNotifier = createNotifier()
    this._beforeUpdate = this._beforeUpdateNotifier.subscribe
    this._beforeUpdate(callback)
  }
  
  _afterUpdate(this: any, callback: () => void) { // TODO
    this._afterUpdateNotifier = createNotifier()
    this._afterUpdate = this._afterUpdateNotifier.subscribe
    this._afterUpdate(callback)
  }

  _beforeUnmount(this: any, callback: () => void) { // TODO
    this._beforeUnmountNotifier = createNotifier()
    this._beforeUnmount = this._beforeUnmountNotifier.subscribe
    this._beforeUnmount(callback)
  }
}

// --- tools ---------------------------------------------------------

function isEventPropName(name: string) {
  return name.match(/^on[A-Z][a-z0-9]*/)
}

function eventPropNameToEventName(eventPropName: string) {
  return toKebabCase(eventPropName.substr(2))
}

function propNameToAttrName(propName: string) {
  return propName.replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// --- utility functions ---------------------------------------------

function hasOwnProp(obj: object, propName: string) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

function isArray(obj: any) {
  return obj instanceof Array
}

function keysOf(obj: object) {
  return Object.keys(obj)
}

function createNotifier() {
  const subscribers: (() => void)[] = []

  return {
    subscribe(subscriber: () => void) {
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
    toString: (value: boolean) => value === true ? '' : null,
    fromString: (value: string) => typeof value === 'string' ? true : false
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

function checkCustomElementConfig(name: string, options: any) { // TODO
  if (typeof name !== 'string' || !name.match(REGEX_TAG_NAME)) {
    throw 'Illegal tag name'
  }
  
  if (options === null) {
    return
  }
  
  const checkParam = (key: string, pred: (it: any) => boolean) => {
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

function checkPropConfig(propName: string, propConfig: any) { // TODO
  if (!propName.match(REGEX_PROP_NAME)) {
    throw `Illegal prop name "${propName}"`
  }

  const type = propConfig.type

  if (hasOwnProp(propConfig, 'type') && !ALLOWED_PROPERTY_TYPES.has(type)) {
    throw `Illegal parameter "type" for property "${propName}"`
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

      if (type && !(defaultValue === null && propConfig.nullable)
        && (type === Boolean && typeOfDefault !== 'boolean'
          || type === Number && typeOfDefault !== 'number'
          || type === String && typeOfDefault !== 'string'
          || type === Object && typeOfDefault !== 'object'
          || type === Function && typeOfDefault !== 'function'
          || type === Array && !(defaultValue instanceof Array)
          || type === Date && !(defaultValue instanceof Date))) {
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

function validateStringArray(arr: any, unique = false, regex?: RegExp) {
  const alreadyUsedValues: any = {} // TODO

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
