import { adapt } from 'js-element/core'
import { render as uhtmlRender, Hole } from 'uhtml'

export {
  attr,
  createEvent,
  createRef,
  intercept,
  Attr,
  Component,
  Context,
  EventHandler,
  MethodsOf,
  Ref,
  UiEvent
} from 'js-element/core'

export { html, svg, Hole } from 'uhtml'

export const { define, render } = adapt<Hole, Hole>({
  isMountable: (it) => it instanceof Hole,
  patchContent: (content, target) => uhtmlRender(target, content!) // TODO!!!!
})
