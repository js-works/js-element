import { h, prop, stateful } from '../../../../main/js-elements'
import DataTable from './DataTable'
import Paginator from '../pagination/Paginator'
import PaginationInfo from '../pagination/PaginationInfo'

export default stateful('jsc-data-explorer', {
  props: {
    title: prop.str.opt(),
    columns: prop.arr.req()
  }
})((c, props) => {
  const [state, setState] = c.addState({
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
