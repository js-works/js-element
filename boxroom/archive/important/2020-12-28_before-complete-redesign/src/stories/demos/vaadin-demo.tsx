import { component, h, prop } from 'js-elements'
import DataExplorer from './components/data/DataExplorer'

component('vaadin-demo', () => {
  return () => (
    <div class="root">
      <DataExplorer columns={[]} />
    </div>
  )
})
