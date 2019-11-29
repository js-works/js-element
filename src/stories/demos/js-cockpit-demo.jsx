import { Spec } from 'js-spec'

import { html, component, prop, useInterval } from '../../main/index'
import '../js-cockpit/modules/data-driven/components/data-explorer'
import '../js-cockpit/modules/layout/components/cockpit'
import '../js-cockpit/modules/misc/components/brand'
import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

component('data-explorer-demo', {
  render() {
    return html`
      <jsc-cockpit header-color="default">
        <div slot="brand">
          <jsc-brand vendor="meet&greet" title="Back Office">
            <div slot="logo">
              Logo
            </div>
          </jsc-brand>
        </div>
        <div slot="top-navi">
          Top Navi
        </div>
        <div slot="action-area">
          User Navi
        </div>
        <div slot="menu">
          Menu
        </div>
        <div slot="sidebar">
          sidebar
        </div>
        <div slot="main">
          Main
        </div>
      </jsc-cockpit>
    `
  }

    /*

    const
      columns = [
        {
          type: 'column',
          title: 'First name',
          field: 'firstName',
          align: 'center',
          sortable: false,
          width: 100
        }
      ]

    return html`
      <div>
        <h3>Data explorer demo</h3>
        <jsc-data-explorer
          .columns=${columns}
        />
      </div>
    `
  }
  */
})

