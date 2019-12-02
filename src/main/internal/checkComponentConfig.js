import hasOwnProp from './hasOwnProp'

const
  ALLOWED_COMPONENT_CONFIG_KEYS = ['props', 'validate', 'methods', 'styles', 'shadow', 'render', 'main'],
  ALLOWED_PROPERTY_CONFIG_KEYS = ['type', 'nullable', 'required', 'defaultValue'],
  ALLOWED_PROPERTY_TYPES = [Boolean, Number, String, Object, Function, Array, Date],
  REGEX_PROPERTY_NAME = /^[a-z][a-zA-Z0-9]*$/

export default function checkComponentConfig(config) {
  const
    props = getParam(config, 'props', 'object'),
    shadow = getParam(config, 'shadow', 'string'),
    render = getParam(config, 'render', 'function'),
    main = getParam(config, 'main', 'function'),
    styles = getParam(config, 'styles') // TODO

  config.validate === null || getParam(config, 'validate', 'function')

  ifInvalidKey(config, ALLOWED_COMPONENT_CONFIG_KEYS, key => {
    throw `Invalid component configuration parameter "${key}"`
  })

  if (render && main) {
    throw 'Component configuration must not have both parameters "render" and "main" at once'
  }

  if (!render && !main) {
    throw 'Component configuration must either have a parameter "render" or a parameter "main"'
  }
  
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

    if (type && typeof ret !== type) {console.log(111, config)
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
