import { directive, AttributePart } from 'lit-html'

// === exports ======================================================

export {
  // functions
  newRef,
  toRef,
  asRef,
  // types
  Ref
}

// === types ========================================================

type Ref<T> = { current: T }

// === newRef ========================================================

function newRef<T = unknown>(): Ref<T | undefined>
function newRef<T>(initialValue: T): Ref<T>
function newRef(initialValue?: any): Ref<any> {
  return new RefClass(initialValue)
}

// === asRef =========================================================

function asRef<T>(arg: T | Ref<T>): Ref<T> {
  return arg instanceof RefClass ? arg : new RefClass(arg)
}

// === toRef =========================================================

function toRef<T>(getter: () => T): Ref<T> {
  const ref = Object.create(RefClass.prototype)

  Object.defineProperty(ref, 'current', {
    enumerable: true,
    get: getter,

    set: () => {
      throw new Error('<ref>.current is read-only')
    }
  })

  return ref
}

// === locals ========================================================

class RefClass<T> {
  current: T

  constructor(initialValue: T) {
    this.current = initialValue
  }
}
