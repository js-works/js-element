// external imports
import {
  h,
  render as preactRender,
  Component as PreactComponent
} from 'preact'

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
    propNames = config.properties ? Object.keys(config.properties) : [],
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

      const self = this

      this._updateTimeout = null
      this._props = defaultProps ? Object.assign({}, defaultProps) : {}
      this._initialized = false
      this._update = () => {} // will be updated later
      
      if (config.render) {
        this._render = config.render.bind(null, this._props)
      } else {
        this._afterMountNotifier = createNotifier(),
        this._beforeUpdateNotifier = createNotifier(),
        this._afterUpdateNotifier = createNotifier()
        this._beforeUnmountNotifier = createNotifier()

        const
          ctrl = {
            update: () => this._update(),
            afterMount: this._afterMountNotifier.subscribe,
            beforeUpdate: this._beforeUpdateNotifier.subscribe,
            afterUpdate: this._afterUpdateNotifier.subscribe,
            beforeUnmount: this._beforeUnmountNotifier.subscribe
          }

        this._render = config.main(ctrl, this._props)
        this._forceUpdate = null // will be set below
      }
      this._preactComponent = class extends PreactComponent {
        constructor(arg) {
          super(arg)

          self._update = () => {
            this.forceUpdate()
          }
        }

        componentDidMount() {
          self._afterMountNotifier.notify()
          self._afterMountNotifier.clear()
          self._initialized = true
        }
        componentDidUpdate() {
          self._afterUpdateNotifier.notify()
        }

        componentWillUnmount() {
          self._beforeUnmountNotifier.notify()
        }

        render() {
          if (self._initialized) {
            self._beforeUpdateNotifier.notify()
          }

          return self._render()
        }
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
      this.attachShadow({ mode: 'open' });
      preactRender(h(this._preactComponent), this.shadowRoot)
      this._initialized = true
    }

    disconnectedCallback() {
      preactRender(null, this)
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
