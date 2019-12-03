import Ref from '../internal/Ref'

export default function toRef(getter) {
  const ref = Object.create(Ref.prototype)

  Object.defineProperty(ref, 'current', {
    enumerable: true,
    get: getter,
    set: () => { throw new Error('<ref>.current is read-only') }
  })

  return ref
}
