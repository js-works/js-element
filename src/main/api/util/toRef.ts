import RefClass from '../../internal/Ref'
import Ref from '../#types/Ref'

export default function toRef<T>(getter: () => T): Ref<T> {
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
