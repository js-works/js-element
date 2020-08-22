import { h, prop, slc } from '../../main/js-elements'
import DataExplorer from './components/data/DataExplorer'

slc('vaadin-demo', {
  render() {
    return (
      <div class="root">
        <DataExplorer columns={[]} />
      </div>
    )
  }
})
