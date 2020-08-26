import { component, h, prop } from 'js-elements'
import PageChangeEvent from '../../events/PageChangeEvent'

// === Paginator =====================================================

export default component('jsc-paginator', {
  props: {
    pageIndex: prop.num.req(),
    pageSize: prop.num.req(),
    totalItemCount: prop.num.req(),
    onPageChange: prop.evt<PageChangeEvent>()
  }
})((c, props) => {
  const onFirstPageClick = () => gotoPage(1)
  const onPreviousPageClick = () => gotoPage(props.pageIndex - 1)
  const onNextPageClick = () => gotoPage(props.pageIndex + 1)
  const onLastPageClick = () => gotoPage(getTotalPageCount() - 1)

  c.addStyles(paginatorStyles)

  return () => (
    <div class="root">
      <button onClick={onFirstPageClick}>First</button>
      <button onClick={onPreviousPageClick}>Previous</button>
      Page
      <input value={props.pageIndex + 1} />
      of {getTotalPageCount()}
      <button onClick={onNextPageClick}>Next</button>
      <button onClick={onLastPageClick}>Last</button>
    </div>
  )

  // --- local component helper functions ----------------------------

  function getTotalPageCount() {
    const { pageSize, totalItemCount } = props

    return Math.ceil(totalItemCount / pageSize)
  }

  function gotoPage(pageIndex: number) {
    c.refresh()

    if (props.onPageChange) {
      props.onPageChange({
        type: 'page-change',
        pageIndex
      })
    }
  }
})

// === styles ========================================================

const paginatorStyles = `
  .root {
    display: flex;
    background-color: yellow;
    border: 1px solid #aaa;
    border-width: 1px 0 0 0;
    margin: 2px 0;
    padding: 2px 0;
  }

  button {
    background-color: transparent;
    border: none;
  }

  button:hover {
    background-color: #eee;
  }

  button:active {
    background-color: #ccc;
  }
`
