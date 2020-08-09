// === imports =================================================

import { createAdaption } from './core/adaption'
import { propConfigBuilder } from './core/propConfigBuilder'
import { renderer, Element as CrankElement } from './libs/crank'

// === exports =======================================================

export { defineCrankElement, propConfigBuilder as prop }

// === defineElement =================================================

const defineCrankElement = createAdaption<any, void>((
  content,
  target // TODO: <CrankElement, void>
) => renderer.render(content, target))
