import Ref from './Ref'

type ValueOrRef<T> = T | Ref<T>

export default ValueOrRef
