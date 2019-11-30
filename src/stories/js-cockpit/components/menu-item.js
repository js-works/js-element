import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'
import addStyleSheet from '../tools/addStyleSheet'

// === js-menu-item =================================================

component('jsc-menu-item', {
  props: {
    text: prop.str.opt(),
    actionId: prop.str.nul.opt(null),
    onAction: prop.func.opt()
  },

  validate: process.env.NODE_ENV === 'development'
    ? Spec.lazy(() => validateMenuItemProps)
    : null,

  render(props) {
    return html`
      <div class="jsc-menu-item">
        ${props.text}
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

addStyleSheet('jsc-menu-item', `
  .jsc-menu-item {
  }
`)
