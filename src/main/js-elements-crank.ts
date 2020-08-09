// === imports =================================================

import { createAdaption, prop } from './core/core'
import { renderer, Element as CrankElement } from './libs/crank'

// === exports =======================================================

export { defineCrankElement, prop }

// === defineElement =================================================

const defineCrankElement = createAdaption<any, void>((
  content,
  target // TODO: <CrankElement, void>
) => renderer.render(content, target))
