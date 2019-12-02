import { Spec } from 'js-spec'
import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

import { html, component } from '../../main/index'
import '../js-cockpit/components/data-explorer'
import '../js-cockpit/components/cockpit'
import '../js-cockpit/components/brand'
import '../js-cockpit/components/logout-button'
import '../js-cockpit/components/menu-bar'
import '../js-cockpit/components/login-form'

component('jsc-cockpit-demo', {
  render() {
    return html`
      <jsc-cockpit header-color="teal">
        <div slot="brand">
          <jsc-brand vendor="meet&greet" title="Back Office">
          </jsc-brand>
        </div>
        <div slot="top-navi">
          Top Navi
        </div>
        <div slot="action-area">
          <jsc-logout-button/>
        </div>
        <div slot="menu">
          MenuBar
        </div>
        <div slot="sidebar">
          sidebar
        </div>
        <div slot="main">
          <jsc-data-explorer></jsc-data-explorer>
          <xjsc-login-form></xjsc-login-form>
         </div>
      </jsc-cockpit>
    `
  }

    /*

           <jsc-login-form
             ?remember-login=${true}
           ></jsc-login-form>
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

