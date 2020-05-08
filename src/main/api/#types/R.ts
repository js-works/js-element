import Ref from './Ref'

type R<T> = T | Ref<T>

export default R