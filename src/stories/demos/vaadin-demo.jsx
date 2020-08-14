import { html, prop, stateful, stateless } from '../../main/js-elements'
import DataExplorer from './components/data/DataExplorer'

const dataExplorerProps = {
  columns: [
    {
      title: 'Column-1'
    },
    {
      title: 'Column-2'
    },
    {
      title: 'Column-3'
    }
  ]
}

stateless('vaadin-demo', {
  render() {
    return html`
      <div class="root">
        <${DataExplorer} ...${dataExplorerProps} />
      </div>
    `
  }
})
