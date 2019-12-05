import { Spec } from 'js-spec'
import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

import { html, component } from '../../main/index'
import '../admin-ui/components/data-explorer'
import '../admin-ui/components/cockpit'
import '../admin-ui/components/brand'
import '../admin-ui/components/logout-button'
import '../admin-ui/components/menu-bar'
import '../admin-ui/components/login-form'

component('admin-ui-demo', {
  render() {
    return html`
      <jsc-cockpit header-color="teal">
        <div slot="brand">
          <jsc-brand vendor="meet&greet" title="Back Office"></jsc-brand>
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

