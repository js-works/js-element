import { Spec } from 'js-spec'
import { html, component, prop, css } from '../../../main/index'

import brandStyles from './brand-styles'

component('jsc-brand', {
  props: {
    vendor: prop.str.opt(),
    title: prop.str.req(),
  },

  styles: brandStyles,
  shadow: 'open',
  render(props) {
    const
      sizeClass = getSizeClass(props.size)

    return html`
      <div class="jsc-brand ${sizeClass}">
        <div class="jsc-brand__first-column">
          <slot>
            <svg version="1.1" width="36" height="36"  viewBox="0 0 36 36"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
            >
              <g fill="currentColor">
              <path d="M18,20.25a1,1,0,0,1-.43-.1l-15-7.09a1,1,0,0,1,0-1.81l15-7.09a1,1,0,0,1,.85,0l15,7.09a1,1,0,0,1,0,1.81l-15,7.09A1,1,0,0,1,18,20.25ZM5.34,12.16l12.66,6,12.66-6L18,6.18Z"></path>
              <path d="M18,26.16a1,1,0,0,1-.43-.1L2.57,19a1,1,0,1,1,.85-1.81L18,24.06l14.57-6.89A1,1,0,1,1,33.43,19l-15,7.09A1,1,0,0,1,18,26.16Z"></path><
              <path d="M18,32.07a1,1,0,0,1-.43-.1l-15-7.09a1,1,0,0,1,.85-1.81L18,30l14.57-6.89a1,1,0,1,1,.85,1.81L18.43,32A1,1,0,0,1,18,32.07Z"></path>
              <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
              </g>
            </svg>
          </slot>
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