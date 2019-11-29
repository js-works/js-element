import { Spec } from 'js-spec'

import { html, component, prop } from '../../../../../../main/index'
import addStyleSheet from '../../../../tools/addStyleSheet'

component('jsc-brand', {
  props: {
    vendor: prop.str.opt(),
    title: prop.str.req(),
  },

  shadow: 'open',
  render(props) {
    const sizeClass = getSizeClass(props.size)

    return html`
      <style>${styleSheet}</style>
      <div class="jsc-brand ${sizeClass}">
        <div class="jsc-brand__first-column">
          <clr-icon shape="layers"></clr-icon>
        </div>
        <div class="jsc-brand__second-column">
          <div class="jsc-brand__vendor">
            ${props.vendor}
          </div>
          <div class="jsc-brand__title">
            ${props.title}
          </div>
        </div>
      </div>
    `
  }
})

const styleSheet = `
  .jsc-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .jsc-brand--small {
    transform-scale: (0.75, 0.75)
  }
  
  .jsc-brand--medium {
  }

  .jsc-brand-large {
    transform-scale: (1.25, 1.25)
  }
  
  .jsc-brand-large {
    transform-scale: (1.5, 1.5)
  }
  
  .jsc-brand__first-column {
    padding: 8px;
  }
  
  .jsc-brand__second-column {
    padding: 0 8px;
  }
  
  .jsc-brand__vendor {

  }
  
  .jsc-brand__title {

  }
`

function getSizeClass(size) {
  switch (size) {
  case 'small':
  case 'large':
  case 'huge':
    return `jsc-brand--${size}`

  default:
    return 'jsc-brand--medium'
  }
}