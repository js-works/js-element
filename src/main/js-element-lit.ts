import { createDefiner, createRenderer } from 'js-element/core'
import { render as litRender, TemplateResult } from 'lit-html'

export { html, svg, TemplateResult } from 'lit-html'

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

export const define = createDefiner<TemplateResult>('define', litRender)

export const render = createRenderer<TemplateResult>(
  'render',
  (it: any) => it instanceof TemplateResult,
  litRender
)
