import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'
import addStyleSheet from '../tools/addStyleSheet'

// === js-menu-separator ============================================

component('jsc-menu-separator', {
  props: {
    text: prop.opt(),
    actionId: prop.str.nul.opt(null),
    onAction: prop.func.opt()
  },

  validate: process.env.NODE_ENV === 'development'
    ? Spec.lazy(() => validateMenuItemProps)
    : null,
  
  render(props) {
    return html`
      <div class="jsc-menu-separator">
        ---
        <slot/>
      </div>
    `
  }
})

// === validation ===================================================

const validateMenuItemProps = Spec.checkProps({
  optional: {
    text: Spec.string,
    actionId: Spec.nullable(Spec.string),
    onAction: Spec.function
  }
}) 

// === styles =======================================================

addStyleSheet('jsc-menu-separator', `
  .jsc-menu-separator {
  }
`)
