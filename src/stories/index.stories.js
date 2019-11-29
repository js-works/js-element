import '@webcomponents/webcomponentsjs'

import './demos/button-demo'
import './demos/simple-counter-demo'
import './demos/complex-counter-demo'
import './demos/clock-demo'
import './demos/iterator-demo'
import './demos/mouse-demo'
import './demos/interval-demo'
import './demos/js-cockpit-demo'

import './styles.css'

import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

export default {
  title: 'Demos',
}

export const button =  () => '<button-demo/>'
export const simpleCounter =  () => '<simple-counter-demo/>'
export const complexCounter =  () => '<complex-counter-demo/>'
export const clock =  () => '<clock-demo/>'
export const mouse =  () => '<mouse-demo/>'
export const iterator =  () => '<iterator-demo/>'
export const interval =  () => '<interval-demo/>'
export const dataExporer =  () => '<data-explorer-demo/>'