import { define, h, VNode } from 'js-elements'
import { useRefresher, useInterval, useStyles } from 'js-elements/hooks'

export default define('data-table-demo', () => {
  return () => <DataTable />
})

type DataTableViewModel = {
  columns: {
    title: string
  }[]
}

const DataTable = define('jsc-data-table', () => {
  const refresh = useRefresher()

  const viewModel: DataTableViewModel = {
    columns: [
      { title: 'Column 1' },
      { title: 'Column 2' },
      { title: 'Column 3' },
      { title: 'Column 4' },
      { title: 'Column 5' },
      { title: 'Column 6' },
      { title: 'Column 7' },
      { title: 'Column 8' }
    ]
  }

  useStyles(dataTableStyles)
  useInterval(refresh, 1000)

  return () => {
    return renderTable(viewModel)
  }
})

function renderTable(viewModel: DataTableViewModel): VNode {
  const tableHeader = renderTableHeader(viewModel)
  const tableBody = renderTableBody(viewModel)

  return (
    <table>
      {tableHeader}
      {tableBody}
    </table>
  )
}

function renderTableHeader(viewModel: DataTableViewModel): VNode {
  const headerColumns: VNode[] = []

  for (const column of viewModel.columns) {
    headerColumns.push(<th>{column.title}</th>)
  }

  return (
    <thead>
      <tr>{headerColumns}</tr>
    </thead>
  )
}

function renderTableBody(viewModel: DataTableViewModel) {
  const rows: VNode[] = []

  for (let i = 0; i < 100; ++i) {
    const cols: VNode[] = []

    rows.push(<tr>{cols}</tr>)

    for (let j = 0; j < viewModel.columns.length; ++j) {
      cols.push(<td>{Math.floor(Math.random() * 10000)}</td>)
    }
  }

  return <tbody>{rows}</tbody>
}

// === styles ========================================================

const dataTableStyles = `
  table {
    border: 1px solid black;
  }

  table tbody tr td {
    border-width: 0 0 1px 0;
    border-color: gray;
    border-width: 1px;
  }
`
