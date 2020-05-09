import VElement from './VElement'

type VNode =
  undefined | null | boolean | number | string | VElement | Iterable<VNode>

export default VNode