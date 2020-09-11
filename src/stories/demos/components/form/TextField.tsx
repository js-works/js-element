import { component, html, prop } from 'js-elements'
import { useState } from 'js-elements/ext'
import '@vaadin/vaadin-text-field'

export default component('jsc-text-field', {
  props: {
    label: prop.str.opt()
  }
}).from((c, props) => {
  return () => html`<vaadin-text-field label=${props.label} />`
})