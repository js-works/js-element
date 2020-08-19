import { component, html, prop } from '../../main/js-elements'
import DataExplorer from './components/data/DataExplorer'
import 'carbon-web-components/es/components/dropdown/dropdown'
import 'carbon-web-components/es/components/dropdown/dropdown-item'
import 'carbon-web-components/es/components/date-picker/date-picker'
import 'carbon-web-components/es/components/date-picker/date-picker-input'
import 'carbon-web-components/es/components/tabs/tabs'
import 'carbon-web-components/es/components/tabs/tab'

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

component('vaadin-demo', {
  render() {
    return html`
      <div class="root">
        ----
        <bx-tabs value="all">
          <bx-tab id="tab-all" target="panel-all" value="all">Option 1</bx-tab>
          <bx-tab
            id="tab-cloudFoundry"
            target="panel-cloudFoundry"
            value="cloudFoundry"
            >Option 2</bx-tab
          >
          <bx-tab id="tab-staging" xtarget="panel-staging" value="staging"
            >Option 3</bx-tab
          >
          <bx-tab id="tab-dea" xtarget="panel-dea" value="dea">Option 4</bx-tab>
          <bx-tab id="tab-router" xtarget="panel-router" value="router"
            >Option 5</bx-tab
          >
        </bx-tabs>
        <div class="bx-ce-demo-devenv--tab-panels">
          <div id="panel-all" role="tabpanel" aria-labelledby="tab-all" hidden>
            <h1>Content for option 1</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <div
            id="panel-cloudFoundry"
            role="tabpanel"
            aria-labelledby="tab-cloudFoundry"
            hidden
          >
            <h1>Content for option 2</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          ----
          <bx-date-picker>
            <bx-date-picker-input kind="single"> </bx-date-picker-input>
          </bx-date-picker>
          <bx-dropdown trigger-content="Select an item">
            <bx-dropdown-item value="all">Option 1</bx-dropdown-item>
            <bx-dropdown-item value="cloudFoundry">Option 2</bx-dropdown-item>
            <bx-dropdown-item value="staging">Option 3</bx-dropdown-item>
            <bx-dropdown-item value="all">Option 1</bx-dropdown-item>
            <bx-dropdown-item value="cloudFoundry">Option 2</bx-dropdown-item>
            <bx-dropdown-item value="staging">Option 3</bx-dropdown-item>
            <bx-dropdown-item value="dea">Option 4</bx-dropdown-item>
            <bx-dropdown-item value="router">Option 5</bx-dropdown-item>
            <bx-dropdown-item value="dea">Option 4</bx-dropdown-item>
            <bx-dropdown-item value="router">Option 5</bx-dropdown-item>
          </bx-dropdown>
          <${DataExplorer} ...${dataExplorerProps} />
        </div>
      </div>
    `
  }
})
