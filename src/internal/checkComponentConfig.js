const
  ALLOWED_COMPONENT_CONFIG_KEYS = ['displayName', 'properties', 'main', 'render'],
  ALLOWED_PROPERTY_CONFIG_KEYS = ['type', 'nullable', 'required', 'defaultValue'],
  ALLOWED_PROPERTY_TYPES = [Boolean, Number, String, Object, Function],
  REGEX_PROPERTY_NAME = /^[a-z][a-zA-Z0-9]*$/

export default function checkComponentConfig(config) {
  const
    render = getParam(config, 'render', 'function'),
    main = getParam(config, 'main', 'function'),
    properties = getParam(config, 'properties', 'object')

  ifInvalidKey(config, ALLOWED_COMPONENT_CONFIG_KEYS, key => {
    throw `Invalid component configuration parameter ${key}`
  })

  if (render && main) {
    throw 'Component configuration must not have both parameters "render" and "main" at once'
  }

  if (!render && !main) {
    throw 'Component configuration must either have a parameter "render" or a parameter "main"'
  }

  if (properties) {
    checkProperties(properties)
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

function checkProperties(properties) {
  for (const key in properties) {
    if (hasOwnProp(properties, key)) {
      if (!REGEX_PROPERTY_NAME.test(key)) {
        throw `Illegal property name "${key}"`
      }

      checkPropertyConfig(key, properties[key])
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

function hasOwnProp(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}