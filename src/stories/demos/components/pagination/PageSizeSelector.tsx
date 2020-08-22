import { h, prop, stateful } from '../../../../main/js-elements'

// === constants =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 100, 250, 500]

export default stateful('jsc-page-size-selector', {
  props: {
    pageSize: prop.num.opt(50)
  }
})((c, props) => {
  return () => (
    <select>
      {PAGE_SIZE_OPTIONS.map((pageSize) => {
        return <option checked={pageSize === props.pageSize}>{pageSize}</option>
      })}
    </select>
  )
})
