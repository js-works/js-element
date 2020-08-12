// === imports =======================================================

import { hasOwnProp } from './utils'

// === exports =======================================================

export { checkComponentOptions, isValidTagName }

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

// === isValidTagName ================================================

function isValidTagName(name: string): boolean {
  return typeof name === 'string' && REGEX_TAG_NAME.test(name)
}

// === checkComponentOptions =========================================

function checkComponentOptions(options: any) {
  if (options === null) {
    return
  }

  if (!options || typeof options !== 'object') {
    throw 'Component options must configured by an object or set to null'
  }

  const checkParam = (key: string, pred: (it: any) => boolean) => {
    if (!pred(options[key])) {
      throw `Invalid option parameter "${key}"`
    }
  }

  for (const key of Object.keys(options)) {
    switch (key) {
      case 'props': {
        const propNames = Object.keys(options.props)

        for (const propName of propNames) {
          checkPropConfig(propName, options.props[propName])
        }

        break
      }

      case 'methods':
        checkParam('methods', (it) =>
          validateStringArray(it, true, REGEX_METHOD_NAME)
        )
        break

      case 'styles':
        if (
          typeof Object.getOwnPropertyDescriptor(options, 'styles')?.get !==
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
