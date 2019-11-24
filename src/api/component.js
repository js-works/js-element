// external imports
import { render as litRender } from 'lit-html'

// internal imports
import checkComponentConfig from '../internal/checkComponentConfig'
import createNotifier from '../internal/createNotifier'
export default function component(arg1, arg2) {
  const config = arg2 && typeof arg2 === 'object'
    ? { displayName: arg1, ...arg2 }
    : arg1

  if (process.env.NODE_ENV === 'development') {
    try {
      if (arguments.length > 1) {
        if (typeof arg1 !== 'string') {
          throw 'String expected as first argument'
        }

        if (!arg2 || typeof arg2 !== 'object') {
          throw 'Object expected as second argument'
        }

        if (arg2.hasOwnProperty('displayName')) {
          throw 'Unexpected component configuration parameter "displayName"'
        }
      } else {
        if (!arg1 || typeof arg1 !== 'object') {
          throw 'Expected object as first argument'
        }
      }

      checkComponentConfig(config)
    } catch (e) {
      throw new TypeError(`[component] ${e}`)
    }
  }

  return generateCustomElementClass(config)
}

function generateCustomElementClass(config) {
  const
    propNames = Object.keys(config.properties),
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
      this._updateTimeout = null
      this._props = defaultProps ? Object.assign({}, defaultProps) : {}
      this._initialized = false
      
      if (config.render) {
        this._render = config.render(this._props)
      } else {
        this._afterMountNotifier = createNotifier(),
        this._beforeRefreshNotifier = createNotifier(),
        this._afterRefreshNotifier = createNotifier()
        this._beforeUnmountNotifier = createNotifier()

        const
          ctrl = {
            refresh: () => this._update(),
            afterMount: this._afterMountNotifier.subscribe,
            beforeRefresh: this._beforeRefreshNotifier.subscribe,
            afterRefresh: this._afterRefreshNotifier.subscribe,
            beforeUnmount: this._beforeUnmountNotifier.subscribe
          },

          render = config.main(ctrl, this._props) // TODO: argument c

        this._render = render
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
      litRender(this._render(), this)
      this._initialized = true
      this._afterMountNotifier.notify()
      this._afterMountNotifier.clear()
    }

    disconnectedCallback() {
      this._beforeUnmountNotifier.notify()
    }

    _update() {
      if (!this._updateTimeout) {
        this._updateTimeout = setTimeout(() => { // TODO
          this._updateTimeout = null
          this._beforeRefreshNotifier.notify()
          const content = this._render(this._props)
          litRender(content, this)
          this._afterRefreshNotifier.notify()
        }, 0)
      }
    }
  }

  propNames.forEach(propName => {
    const
      propConfig = config.properties[propName],
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

  return {
    register(tagName) {
      customElements.define(tagName, CustomElement)
    }
  }
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
