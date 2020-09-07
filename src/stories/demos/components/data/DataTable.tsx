import { component, h, prop } from 'js-elements'

export default component('jsc-data-table', {
  props: {
    columns: prop.arr.req()
  }
}).from((c, props) => {
  return () => (
    <div>
      <h4>DataTable</h4>
      <div></div>
    </div>
  )
})
