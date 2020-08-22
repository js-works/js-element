import { component, h, prop } from '../../../../main/js-elements'

export default component.stateless({
  name: 'jsc-pagination-info',

  props: {
    pageIndex: prop.num.req(),
    pageSize: prop.num.req(),
    totalItemCount: prop.num.req(),
    about: prop.str.as<'pages' | 'items'>().opt('items')
  }
})((props) => {
  return props.about === 'pages' ? renderAboutPages() : renderAboutItems()

  // --- local component helper functions ----------------------------

  function renderAboutItems() {
    return <div>About items</div>
  }

  function renderAboutPages() {
    return <div>About pages</div>
  }
})
