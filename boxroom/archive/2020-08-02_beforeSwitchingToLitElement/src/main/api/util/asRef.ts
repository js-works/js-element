import RefClass from '../../internal/RefClass'
import Ref from '../#types/Ref'

export default function asRef<T>(arg: T | Ref<T>): Ref<T> {
  return (arg instanceof RefClass)
    ? arg
    : new RefClass(arg)
}
