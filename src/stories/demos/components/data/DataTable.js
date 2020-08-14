import { component, html, prop } from '../../../../main/js-elements'
import { useState } from '../../../../main/js-elements-ext'
import '@vaadin/vaadin-grid'

export default component('jsc-data-table', {
  props: {
    columns: prop.arr.req()
  },

  main(c, props) {
    return () => html`
      <div>
        <h4>DataTable</h4>
        <div>
          ${renderDataGrid()}
        </div>
      </div>
    `

    // ---

    function renderDataGrid() {
      const children = props.columns.map((column) => {
        return html`<vaadin-grid-column header=${column.title} />`
      })

      return html`
        <vaadin-grid height="300">
          ${children}
        </vaadin-grid>
      `
    }
  }
})
