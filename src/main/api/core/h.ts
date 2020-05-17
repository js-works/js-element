//import { h as h2 } from '../../internal/vdom'
import { h as h2 } from '../../internal/platform'
import Component from '../#types/Component'

export default function h(type: string  | Component, ...rest: any[]): Element { // TODO
  const second = rest[0]

  if (typeof type === 'function') {
    type = (type as any)['js-elements:type']
  }

  if (second !== undefined &&  second !== null && (typeof second !== 'object' || second.kind === 'virtual-element' )) {
    rest.unshift(null)
  }

  return (h2 as any)(type, ...rest) // TODO
}
