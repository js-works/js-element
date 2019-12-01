import '@webcomponents/webcomponentsjs'

import './demos/button-demo'
import './demos/simple-counter-demo'
import './demos/simple-counter-2-demo'
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

export const Button =  () => '<button-demo></button-demo>'

export const SimpleCounter =  () => '<simple-counter-demo></simple-counter-demo>'
export const SimpleCounter2 =  () => '<simple-counter-2-demo></simple-counter-2-demo>'
export const ComplexCounter =  () => '<complex-counter-demo></complex-counter-demo>'
export const Clock =  () => '<clock-demo></clock-demo>'
export const Mouse =  () => '<mouse-demo></mouse-demo'
export const Iterator =  () => '<iterator-demo/>'
export const Interval =  () => '<interval-demo></iterator-demo>'
export const JSCockpit =  () => '<jsc-cockpit-demo></jsc-cockpit-demo>'