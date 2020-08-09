// === imports =======================================================

import { hasOwnProp } from './utils'

// === exports =======================================================

export { checkComponentConfig, isValidTagName }

// === constants =====================================================

const ALLOWED_PROPERTY_TYPES = new Set([
  Boolean,
  Number,
  String,
  Object,
  Function,
  Array,
  Date
])

const REGEX_TAG_NAME = /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/
const REGEX_PROP_NAME = /^[a-z][a-zA-Z0-9]*$/
const REGEX_METHOD_NAME = /^[a-z][a-z0-9]*$/
const REGEX_SLOT_NAME = /^[a-z][a-z0-9]*$/
const REGEX_CTX_KEY = /^[a-z][a-z0-9]*$/

// === isValidTagName ================================================

function isValidTagName(name: string): boolean {
  return typeof name === 'string' && REGEX_TAG_NAME.test(name)
}

// === checkComponentConfig ==========================================

function checkComponentConfig(config: any) {
  if (config === undefined) {
    return
  }

  if (!config || typeof config !== 'object') {
    throw 'Component configuration must be an object'
  }

  if (
    Number(hasOwnProp(config, 'render')) +
      Number(hasOwnProp(config, 'main')) +
      Number(hasOwnProp(config, 'view')) >
    1
  ) {
    throw 'Component configuration can only have one of the parameters "render", "main" or "view"'
  }

  const checkParam = (key: string, pred: (it: any) => boolean) => {
    if (!pred(config[key])) {
      throw `Invalid option parameter "${key}"`
    }
  }

  for (const key of Object.keys(config)) {
    switch (key) {
      case 'props': {
        const propNames = Object.keys(config.props)

        for (const propName of propNames) {
          checkPropConfig(propName, config.props[propName])
        }

        break
      }

      case 'ctx': {
        checkCtxConfig(config.ctx)
        break
      }

      case 'methods':
        checkParam('methods', (it) =>
          validateStringArray(it, true, REGEX_METHOD_NAME)
        )
        break

      case 'styles':
        if (
          typeof Object.getOwnPropertyDescriptor(config, 'styles')?.get !==
          'function'
        ) {
          checkParam('styles', validateStringOrStringArray)
        }

        break

      case 'slots':
        checkParam('slots', (it) =>
          validateStringArray(it, true, REGEX_SLOT_NAME)
        )
        break

      case 'render':
        checkParam('render', validateFunction)
        break

      case 'main':
        checkParam('main', validateFunction)
        break

      case 'view':
        checkParam('view', validateFunction)
        break

      default:
        throw new TypeError(`Illegal parameter "${key}"`)
    }
  }
}

function checkPropConfig(propName: string, propConfig: any) {
  // TODO
  if (!propName.match(REGEX_PROP_NAME)) {
    throw `Illegal prop name "${propName}"`
  }

  const type = propConfig.type

  if (hasOwnProp(propConfig, 'type') && !ALLOWED_PROPERTY_TYPES.has(type)) {
    throw `Illegal parameter "type" for property "${propName}"`
  }

  for (const key of Object.keys(propConfig)) {
    switch (key) {
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
        const defaultValue = propConfig.defaultValue
        const typeOfDefault = typeof defaultValue

        if (
          type &&
          !(defaultValue === null && propConfig.nullable) &&
          ((type === Boolean && typeOfDefault !== 'boolean') ||
            (type === Number && typeOfDefault !== 'number') ||
            (type === String && typeOfDefault !== 'string') ||
            (type === Object && typeOfDefault !== 'object') ||
            (type === Function && typeOfDefault !== 'function') ||
            (type === Array && !(defaultValue instanceof Array)) ||
            (type === Date && !(defaultValue instanceof Date)))
        ) {
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

function checkCtxConfig(ctxConfig: any) {
  if (!ctxConfig || typeof ctxConfig !== 'object') {
    throw 'Component config parameter "ctx" must be an object'
  }

  const ctxKeys = Object.keys(ctxConfig)

  for (const ctxKey of ctxKeys) {
    if (!ctxKey.match(REGEX_CTX_KEY)) {
      throw `Illegal component context key "${ctxKey}"`
    }

    if (typeof ctxConfig[ctxKey] !== 'function') {
      throw `Parameter "${ctxKey}" of "ctx" object must be a function`
    }
  }
}

function validateFunction(fn: any) {
  return typeof fn === 'function'
}

function validateStringOrStringArray(subj: any) {
  return typeof subj === 'string' || validateStringArray(subj)
}

function validateStringArray(arr: any, unique = false, regex?: RegExp) {
  const alreadyUsedValues: any = {} // TODO

  if (!Array.isArray(arr)) {
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
