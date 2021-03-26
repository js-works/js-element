import { createDefiner } from 'js-element'
import { render as litRender, TemplateResult } from 'lit-html'

export { attr, event, ref, Attr } from 'js-element'
export { html } from 'lit-html'

export const define = createDefiner('define', litRender)

export function render(content: TemplateResult, container: Element | string) {
  if (process.env.NODE_ENV === ('development' as string)) {
    if (content !== null && !(content instanceof TemplateResult)) {
      throw new TypeError(
        'First argument "content" of function "render" must be' +
          ' of type TemplateResult or null'
      )
    }

    if (!container || (typeof container !== 'string' && !container.tagName)) {
      throw new TypeError(
        'Second argument "container" of function "render" must either be a DOM' +
          ' element or selector string for the DOM element'
      )
    }
  }

  const target =
    typeof container === 'string'
      ? document.querySelector(container)
      : container

  if (!target) {
    throw new TypeError(`Could not find container DOM element "${container}"`)
  }

  target.innerHTML = ''

  if (content !== null) {
    litRender(content, target)
  }
}
