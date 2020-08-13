// === imports =======================================================

import { Notifier } from './types'

// === exports =======================================================

export { isEqualArray, hasOwnProp, getOwnProp }

// === utils =========================================================

function hasOwnProp(obj: object, propName: string) {
  return (
    obj !== undefined &&
    obj !== null &&
    Object.prototype.hasOwnProperty.call(obj, propName)
  )
}

function getOwnProp(obj: any, propName: string): any {
  return hasOwnProp(obj, propName) ? obj[propName] : undefined
}

function isEqualArray(arr1: any[], arr2: any[]) {
  let ret =
    Array.isArray(arr1) && Array.isArray(arr2) && arr1.length === arr2.length

  if (ret) {
    for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i]) {
        ret = false
        break
      }
    }
  }

  return ret
}
