import { createDefiner, createRenderer } from 'js-element'
import { render as litRender, TemplateResult } from 'lit-html'

export { html, svg, TemplateResult } from 'lit-html'

export {
  attr,
  event,
  hook,
  ref,
  Attr,
  EventHandler,
  MethodsOf,
  Ref,
  UIEvent
} from 'js-element'

export const define = createDefiner<TemplateResult>('define', litRender)

export const render = createRenderer<TemplateResult>(
  'render',
  (it: any) => it instanceof TemplateResult,
  litRender
)
