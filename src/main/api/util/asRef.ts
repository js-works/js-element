import RefClass from '../../internal/Ref'
import Ref from '../#types/Ref'

export default function asRef<T>(arg: T | Ref<T>): any /*Ref<T>*/ { // TODO
  return (arg instanceof RefClass)
    ? arg
    : new RefClass(arg)
}
