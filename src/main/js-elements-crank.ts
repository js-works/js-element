// === imports =================================================

import { createAdaption, prop } from './api/core'
import { renderer, Element as CrankElement } from './internal/crank'

// === exports =======================================================

export { defineCrankElement, prop }

// === defineElement =================================================

const defineCrankElement = createAdaption<any, void>((content, target) => // TODO: <CrankElement, void>
  renderer.render(content, target)
)
