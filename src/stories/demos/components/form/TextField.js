import { component, html, prop } from '../../../../main/js-elements'
import { useState } from '../../../../main/js-elements-ext'
import '@vaadin/vaadin-text-field'

export default component('jsc-text-field', {
  props: {
    label: prop.str.opt()
  },

  main(c, props) {
    return () => html`<vaadin-text-field label=${props.label} />`

    // ---
  }
})
