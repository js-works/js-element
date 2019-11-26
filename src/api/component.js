// external import
import { render as litRender } from 'lit-html'

// internal imports
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
          getRoot: () => root,
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
        afterMountNotifier && afterMountNotifier.notify,
        beforeUpdateNotifier && beforeUpdateNotifier.notify,
        afterUpdateNotifier && afterUpdateNotifier.notify,
        beforeUnmountNotifier && beforeUnmountNotifier.notify
      )

      update = forceUpdate
      this._unmount = unmount
    }

    disconnectedCallback() {
      this._unmount()
    }
  }

  propNames.forEach(propName => {
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

    if (propConfig.hasOwnProperty('defaultValue')) {
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

  return CustomElement
}

class BaseElement extends HTMLElement {
  constructor() {
    super()
  }
}

function isEventName(name) {
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
      doAfterUpdate && doAfterUpdate()
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
