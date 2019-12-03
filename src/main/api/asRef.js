import Ref from '../internal/Ref'
export default function asRef(arg) {
  return (arg instanceof Ref)
    ? arg
    : new Ref(arg)
}
