import { component, h, prop } from 'js-elements'

export default component('jsc-pagination-info', {
  props: {
    pageIndex: prop.num.req(),
    pageSize: prop.num.req(),
    totalItemCount: prop.num.req(),
    about: prop.str.as<'pages' | 'items'>().opt('items')
  }
}).main((c, props) => () => {
  return props.about === 'pages' ? renderAboutPages() : renderAboutItems()

  // --- local component helper functions ----------------------------

  function renderAboutItems() {
    return <div>About items</div>
  }

  function renderAboutPages() {
    return <div>About pages</div>
  }
})
