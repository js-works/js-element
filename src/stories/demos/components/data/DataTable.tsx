import { component, h, prop } from '../../../../main/js-elements'

export default component({
  name: 'jsc-data-table',

  props: {
    columns: prop.arr.req()
  }
}).stateful((c, props) => {
  return () => (
    <div>
      <h4>DataTable</h4>
      <div></div>
    </div>
  )
})
