import { createDefiner, createRenderer } from 'js-element/core'
import { render as uhtmlRender, Hole } from 'uhtml'

export {
  attr,
  event,
  hook,
  ref,
  Attr,
  Component,
  EventHandler,
  MethodsOf,
  Ref,
  UIEvent
} from 'src/main/js-element-core'

export { html, svg, Hole } from 'uhtml'

export const define = createDefiner<Hole>('define', renderContent)

export const render = createRenderer<Hole>(
  'render',
  (it: any) => it instanceof Hole,
  renderContent
)

function renderContent(content: Hole, target: Element) {
  uhtmlRender(target, content)
}
