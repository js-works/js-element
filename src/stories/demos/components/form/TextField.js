import { component, html, prop } from '../../../../main/js-elements'
import { $state } from '../../../../main/js-elements-ext'
import '@vaadin/vaadin-text-field'

export default component({
  name: 'jsc-text-field',

  props: {
    label: prop.str.opt()
  }
}).stateful((c, props) => {
  return () => html`<vaadin-text-field label=${props.label} />`
})
