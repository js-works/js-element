import { Spec } from 'js-spec'
import { html, component, prop } from '../../../main/index'

import logoutButtonStyles from './logout-button-styles'

component('jsc-logout-button', {
  props: {
    onClick: prop.func.opt()
  },

  styles: logoutButtonStyles,
  render(props) {
    return html`
      <span>
        <div class="jsc-logout-button">
          <clr-icon class="jsc-logout-button__icon" shape="power"></clr-icon>
        </div>
      </span>
    `
  }
})
