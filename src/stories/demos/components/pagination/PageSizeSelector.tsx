import { component, h, prop } from 'js-elements'

// === constants =====================================================

const PAGE_SIZE_OPTIONS = [10, 25, 100, 250, 500]

export default component('jsc-page-size-selector')({
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
