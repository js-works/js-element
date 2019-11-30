import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'

// === js-menu ======================================================

component('jsc-menu', {
  props: {
    text: prop.str.opt()
  },

  validate: process.env.NODE_ENV === 'development'
    ? Spec.lazy(() => validateMenuProps)
    : null,

  shadow: 'open',

  render(props) {
    return html`
      <style>${styleSheet}</style>
      <div class="jsc-menu">
        ${props.text}
        <slot/>
      </div>
    `
  }
})

// === validation ===================================================

const validateMenuProps = Spec.checkProps({
  optional: {
    text: Spec.string
  }
}) 

// === styles =======================================================

const styleSheet = `
  .jsc-menu {
  }
`
