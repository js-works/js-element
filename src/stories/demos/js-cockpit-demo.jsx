import { Spec } from 'js-spec'

import { html, component, prop, useInterval } from '../../main/index'
import '../js-cockpit/components/data-explorer'
import '../js-cockpit/components/cockpit'
import '../js-cockpit/components/brand'
import '../js-cockpit/components/logout-button'
import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

component('js-cockpit-demo', {
  render() {
    return html`
      <jsc-cockpit header-color="teal">
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
          <jsc-logout-button/>
        </div>
        <div slot="menu">
          Menu
        </div>
        <div slot="sidebar">
          sidebar
        </div>
        <div slot="main">
          <jsc-data-explorer/>
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

