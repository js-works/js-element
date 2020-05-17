export default function isElement(it: any) {
  return !!it && it.kind === 'virtual-element'
}