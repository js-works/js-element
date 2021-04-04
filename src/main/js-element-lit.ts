import { adapt } from 'js-element/core'
import { render as litRender, TemplateResult } from 'lit-html'

export { html, svg, TemplateResult } from 'lit-html'

export {
  attr,
  createEvent,
  createRef,
  defineProvider,
  intercept,
  Attr,
  Component,
  Context,
  Listener,
  MethodsOf,
  Ref,
  TypedEvent
} from 'js-element/core'

export const { define, render } = adapt<TemplateResult, TemplateResult>({
  isMountable: (it) => it instanceof TemplateResult,
  patchContent: (content, container) => litRender(content, container)
})
