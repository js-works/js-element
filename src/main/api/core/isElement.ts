import { isValidElement } from '../../internal/platform'

export default function isElement(it: any) {
  return isValidElement(it)
  //return !!it && it.kind === 'virtual-element'
}