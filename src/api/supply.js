import Supplier from '../internal/Supplier'

export default function supply(getter) {
  return new Supplier(getter)
}

