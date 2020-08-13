import { createCustomElementClass } from './createCustomElementClass'
import {
  Action,
  AnyElement,
  Class,
  Ctrl,
  FunctionDefineElement,
  Message,
  Methods,
  Notifier,
  PropConfig,
  Renderer,
  VNode
} from './types'

import { createNotifier } from './createNotifier'
import { isEqualArray } from './utils'
import { checkComponentOptions, isValidTagName } from './validation'

// === exports =======================================================

export { createAdaption }

// === constants =====================================================

const MESSAGE_EVENT_TYPE = 'js-element:###message###'

// === createAdaption ================================================

function createAdaption<O, R>(
  renderer: (content: O, target: Element) => void
): FunctionDefineElement<O, R> {
  return (name: string, options: any, init: any) =>
    defineElementWithRenderer(name, options, init, renderer) as any // TODO
}

// === defineElementWithRenderer =====================================

function defineElementWithRenderer(
  name: string,
  options: any,
  init: (c: Ctrl, props: any) => () => VNode,
  renderer: any
): void {
  if (process.env.NODE_ENV === ('development' as any)) {
    if (typeof name !== 'string') {
      throw new TypeError(
        'First argument for function "defineElement" must be a string'
      )
    } else if (!isValidTagName(name)) {
      throw new Error(`Illegal tag name for custom element: "${name}"`)
    }

    try {
      checkComponentOptions(options)
    } catch (errorMsg) {
      throw new TypeError(
        `Invalid options for custom element "${name}": ${errorMsg}`
      )
    }
  }

  const CustomElement = createCustomElementClass(
    name,
    (options && options.props) || null,
    (options && options.styles) || null,
    (options && options.methods) || null,
    init,
    renderer
  )

  customElements.define(name, CustomElement)
}
