import { h, prop, stateless } from '../../main/js-elements'
import DataExplorer from './components/data/DataExplorer'

stateless('vaadin-demo', {
  render() {
    return (
      <div class="root">
        <DataExplorer columns={[]} />
      </div>
    )
  }
})
