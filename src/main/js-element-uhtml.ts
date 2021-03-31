import { adapt } from 'js-element/core'
import { render as uhtmlRender, Hole } from 'uhtml'

export {
  attr,
  event,
  intercept,
  ref,
  Attr,
  Component,
  EventHandler,
  MethodsOf,
  Ref,
  UIEvent
} from 'js-element/core'

export { html, svg, Hole } from 'uhtml'

export const { define, render } = adapt<Hole, Hole>({
  isMountable: (it) => it instanceof Hole,
  patchContent: (content, target) => uhtmlRender(target, content!) // TODO!!!!
})
