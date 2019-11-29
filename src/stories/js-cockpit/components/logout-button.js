import { Spec } from 'js-spec'

import { html, component, prop } from '../../../main/index'
import addStyleSheet from '../tools/addStyleSheet'

component('jsc-logout-button', {
  props: {
    onClick: prop.func.opt()
  },

  render(props) {
    return html`
      <span>
        <div class="jsc-logout-button">
          <clr-icon class="jsc-logout-button__icon" shape="power"/>
        </div>
      </span>
    `
  }
})

addStyleSheet('jsc-logout-button', `
  .jsc-logout-button {
    border: 0;
    background-color: orange;
    width: 42px;
    height: 40px;
  }

  .jsc-logout-button__icon {
    margin-top: 4px;
    margin-left: 7px;
    width: 28px;
    height: 28px;
  }
`)
