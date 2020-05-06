import { h as h2 } from '../internal/vdom'

export default function h(type, ...rest) {
  const second = rest[0]

  if (typeof type === 'function') {
    type = type.type
  }

  if (second !== undefined &&  second !== null && (typeof second !== 'object' || second.kind === 'virtual-element' )) {
    rest.unshift(null)
  }

  return h2(type, ...rest)
}
