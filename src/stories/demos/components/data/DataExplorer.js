import { component, html, prop } from '../../../../main/js-elements'
import { withState } from '../../../../main/js-elements-ext'
import DataTable from './DataTable'
import Paginator from '../pagination/Paginator'
export default component('jsc-data-explorer', {
  props: {
    title: prop.str.opt(),
    columns: prop.arr.req()
  },

  main(c, props) {
    const [state, setState] = withState(c, {
      pageIndex: 0,
      pageSize: 25,
      totalItemCount: 1253
    })

    return () => html`
      <div>
        <div>
          ${renderFooter()}
        </div>
        <div>
          ${renderHeader()}
        </div>
        <div>
          ${renderDataTable()}
        </div>
      </div>
    `

    // ---

    function renderHeader() {
      return html`<div>Header</div>`
    }

    function renderDataTable() {
      return html`<${DataTable} columns=${props.columns} />`
    }

    function renderFooter() {
      return html`
        <div>
          ${renderPaginator()}
        </div>
      `
    }

    function renderPaginator() {
      return html`
        <div>
          <${Paginator}
            pageIndex=${state.pageIndex}
            pageSize=${state.pageSize}
            totalItemCount=${state.totalItemCount}
          />
        </div>
      `
    }
  }
})
