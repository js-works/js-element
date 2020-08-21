import { component, h, prop } from '../../main/js-elements'
import DataExplorer from './components/data/DataExplorer'

component('vaadin-demo', {
  render() {
    return (
      <div class="root">
        <DataExplorer columns={[]} />
      </div>
    )
  }
})
