// external imports
import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'
import addStyleSheet from '../tools/addStyleSheet'

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
        <div class="jsc-menu-bar">
        Menubar
          <ul>
            <slot/>
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

addStyleSheet('jsc-logout-button', `
  .jsc-menu-bar {
  }

  .jsc-menu-bar * {
    xxxdisplay: none;
  }
  
  .jsc-menu-bar .jsc-menu {
    display: block !important;
  }

  .jsc-menu-bar .jsc-menu-item {
    display: block !important;
  }
  
  .jsc-menu-bar .jsc-menu-separator {
    display: block !important;
  }

  .jsc-logout-button__icon {
    margin-top: 4px;
    margin-left: 7px;
    width: 28px;
    height: 28px;
  }
`)

// === misc =========================================================
