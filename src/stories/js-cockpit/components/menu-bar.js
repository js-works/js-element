// external imports
import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'

// === js-menu-bar ==================================================

component('jsc-menu-bar', {
  props: {
    items: prop.obj.req(),
    onAction: prop.func.opt()
  },

  validate: process.env.NODE_ENV === 'developement'
    ? Spec.lazy(() => validateMenuBarProps)
    : null,

  shadow: 'open',
  main(c, props) {console.log('props:', props)
    return () => html`
      <span>
        <style>${styleSheet}</style>
        <div class="jsc-menu-bar">
          <ul>
            <slot>jUHUUU</slot>
          </ul>
        </div>
      </span>
    `
  }
})

// === validation ===================================================

const validateMenuBarProps = Spec.checkProps({
  optional: {
    onAction: Spec.function,
  }
})

// === styles =======================================================

const styleSheet = `
  .jsc-menu-bar {
  }

  .jsc-menu-bar .jsc-menu {
    border: 1px solid #aaa;
  }

  .jsc-menu-bar ul {
    display: flex;
    flex-direction: row;
     list-style-type: none;
  }

`

// === misc =========================================================
