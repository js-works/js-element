import { h, prop, sfc } from '../../../../main/js-elements'

export default sfc({
  name: 'jsc-data-table',

  props: {
    columns: prop.arr.req()
  }
})((c, props) => {
  return () => (
    <div>
      <h4>DataTable</h4>
      <div></div>
    </div>
  )
})
