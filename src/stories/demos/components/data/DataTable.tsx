import { h, prop, stateful } from '../../../../main/js-elements'

export default stateful({
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
