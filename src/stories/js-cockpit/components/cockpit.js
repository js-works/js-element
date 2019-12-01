import { Spec } from 'js-spec'

import { html, component, prop } from '../../../main/index'
import addStyles from '../tools/addStyles'

component('jsc-cockpit', {
  props: {
    headerColor: prop.str.opt('default')
  },

  shadow: 'open',
  main(c, props) {
    const
      headerClass =
        'js-cockpit__header '
          + getHeaderColorClass(props.headerColor)

    return () => html`
      <div class="jsc-cockpit">
        <use-styles name="jsc-cockpit"></use-styles>
        <use-all-global-styles></use-all-global-styles>
        <div class=${headerClass}>
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

addStyles('jsc-cockpit', `
  .jsc-cockpit {
    display: flex;
    flex-direction: column;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .jsc-cockpit__header {
    display: flex;
    flex-direction: row;
    height: 40px;
  }

  .jsc-cockpit__header--default-color {
     color: white;
     background-color: #002538;
  }
  
  .jsc-cockpit__header--blue {
    color: white;
    background-color: #006690;
  }
  
  .jsc-cockpit__header--orange {
    color: black;
    background-color: #DE400F;
  }
  
  .jsc-cockpit__header--teal {
    color: white;
    background-color: #007E7A;
  }
  
  .jsc-cockpit__brand {
  }

  .jsc-cockpit__top-navi {
    flex-grow: 1;
  }

  .jsc-cockpit__action-area {
  }

  .jsc-cockpit__content {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
  }

  .jsc-cockpit__sidebar {
    width: 200px;
  }

  .jsc-cockpit__main {
    flex-grow: 1;
  }
`)

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