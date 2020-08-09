// === imports =======================================================

import { Notifier } from './types'

// === exports =======================================================

export { createNotifier, isEqualArray, hasOwnProp }

// === utils =========================================================

function hasOwnProp(obj: object, propName: string) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
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

// === createNotifier ================================================

function createNotifier(): Notifier {
  const subscribers: (() => void)[] = []

  return {
    subscribe(subscriber: () => void) {
      subscribers.push(subscriber)
    },

    notify() {
      subscribers.forEach((subscriber) => subscriber())
    }
  }
}
