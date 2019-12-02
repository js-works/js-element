import { Spec } from 'js-spec'
import { html, component, prop } from '../../../main/index'

import cockpitStyles from './cockpit-styles'

component('jsc-cockpit', {
  props: {
    headerColor: prop.str.opt('default')
  },

  shadow: 'open',
  styles: cockpitStyles,

  main(c, props) {
    const
      headerClass =
        'jsc-cockpit__header '
          + getHeaderColorClass(props.headerColor)

    return () => html`
      <div class="jsc-cockpit">
        <div class="${headerClass}">
          <div class="jsc-cockpit__brand">
            <slot name="brand"></slot>
          </div>
          <div class="jsc-cockpit__top-navi">
            <slot name="top-navi"></slot>
          </div>
          <div class="jsc-cockpit__action-area">
            <slot name="action-area"></slot>
          </div>
        </div>
        <div class="jsc-cockpit__menu">
          <slot name="menu"></slot>
        </div>
        <div class="jsc-cockpit__content">
          <div class="jsc-cockpit__sidebar">
            <slot name="sidebar"></slot>
          </div>
          <div class="jsc-cockpit__main">
            <slot name="main"></slot>
          </div>
        </div>
      </div>
    `
  }
})

function getHeaderColorClass(headerColor) {
  switch (headerColor) {
  case 'blue':
  case 'orange':
  case 'teal':
    return `jsc-cockpit__header--${headerColor}`

  default:
    return 'jsc-cockpit__header--default-color'
  }
}