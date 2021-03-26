import { createDefiner, createRenderer } from 'js-element'
import { render as uhtmlRender, Hole } from 'uhtml'

export { attr, event, hook, ref, Attr } from 'js-element'
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
