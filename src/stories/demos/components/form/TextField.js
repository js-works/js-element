import { html, prop, stateful } from '../../../../main/js-elements'
import { withState } from '../../../../main/js-elements-ext'
import '@vaadin/vaadin-text-field'

const textFieldMeta = {
  name: 'jsc-text-field',

  props: {
    label: prop.str.opt()
  }
}

export default stateful(textFieldMeta, (c, props) => {
  return () => html`<vaadin-text-field label=${props.label} />`

  // ---
})
