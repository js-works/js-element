import Supplier from '../internal/Supplier'

export default function supplier(arg) {
  return (arg instanceof Supplier)
    ? arg
    : new Supplier(() => arg)
}