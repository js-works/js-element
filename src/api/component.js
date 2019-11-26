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
      this._props = defaultProps ? Object.assign({}, defaultProps) : {}
      this._unmount = null // will be set in method connectedCallback
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
        render,
        update,
        afterMountNotifier,
        beforeUpdateNotifier,
        afterUpdateNotifier,
        beforeUnmountNotifier

      if (config.render) {
        render = config.render.bind(null, this._props)
      } else {
        afterMountNotifier = createNotifier()
        beforeUpdateNotifier = createNotifier()
        afterUpdateNotifier = createNotifier()
        beforeUnmountNotifier = createNotifier()

        const ctrl = {
          update: () => update && update(),
          afterMount: afterMountNotifier.subscribe,
          beforeUpdate: beforeUpdateNotifier.subscribe,
          afterUpdate: afterUpdateNotifier.subscribe,
          beforeUnmount: beforeUnmountNotifier.subscribe
        }

        render = config.main(ctrl, this._props)
      }

      this.attachShadow({ mode: 'open' })

      const { update: forceUpdate, unmount } = mountComponent(
        this.shadowRoot,
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

function mountComponent(
  target,
  render,
  doAfterMount,
  doBeforeUpdate,
  doAfterUpdate, 
  doBeforeUnmount
) {
  let preactComponentInstance = null

  const CustomPreactComponent = class extends PreactComponent {
    constructor(arg) {
      super(arg)
      this._mounted = false
      preactComponentInstance = this
    }

    componentDidMount() {
      this._mounted = true
      doAfterMount && doAfterMount()
    }
    componentDidUpdate() {
      doAfterUpdate && doAfterUpdate()
    }

    componentWillUnmount() {
      doBeforeUnmount && doBeforeUnmount() 
    }

    render() {
      if (this._mounted) {
        doBeforeUpdate && doBeforeUpdate()
      }

      return render()
    }
  }

  preactRender(h(CustomPreactComponent), target)

  return {
    update: () => preactComponentInstance.forceUpdate(),
    unmount: () => preactRender(null, target)
  }
}
