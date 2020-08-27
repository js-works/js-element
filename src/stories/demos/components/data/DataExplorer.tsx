import { component, h, prop } from 'js-elements'
import { useState } from 'js-elements/ext'
import DataTable from './DataTable'
import Paginator from '../pagination/Paginator'
import PaginationInfo from '../pagination/PaginationInfo'

export default component('jsc-data-explorer', {
  props: {
    title: prop.str.opt(),
    columns: prop.arr.req()
  }
}).main((c, props) => {
  const [state, setState] = useState(c, {
    pageIndex: 0,
    pageSize: 25,
    totalItemCount: 1253
  })

  return () => (
    <div>
      <div>{renderHeader()}</div>
      <div>{renderDataTable()}</div>
      <div>{renderFooter()}</div>
    </div>
  )

  // ---

  function renderHeader() {
    return <div>Header</div>
  }

  function renderDataTable() {
    return <DataTable columns={props.columns} />
  }

  function renderFooter() {
    return (
      <div>
        <Paginator
          pageIndex={state.pageIndex}
          pageSize={state.pageSize}
          totalItemCount={state.totalItemCount}
        />
        <PaginationInfo
          pageIndex={state.pageIndex}
          pageSize={state.pageSize}
          totalItemCount={state.totalItemCount}
        />
      </div>
    )
  }
})
