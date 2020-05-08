import { h as h2 } from '../../internal/vdom'

export default function h(type: any, ...rest: any[]) { // TODO
  const second = rest[0]

  if (typeof type === 'function') {
    type = type['js-elements:type']
  }

  if (second !== undefined &&  second !== null && (typeof second !== 'object' || second.kind === 'virtual-element' )) {
    rest.unshift(null)
  }

  return (h2 as any)(type, ...rest) // TODO
}
