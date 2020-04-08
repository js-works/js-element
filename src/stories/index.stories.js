import '@webcomponents/webcomponentsjs'

import './demos/button-demo'
import './demos/simple-counter-demo'
import './demos/complex-counter-demo'
import './demos/clock-demo'
import './demos/iterator-demo'
import './demos/mouse-demo'
import './demos/interval-demo'
import './styles.css'

export default {
  title: 'Demos',
}

export const Button =  () => '<button-demo></button-demo>'

export const SimpleCounter =  () => '<simple-counter-demo></simple-counter-demo>'
export const ComplexCounter =  () => '<complex-counter-demo></complex-counter-demo>'
export const Clock =  () => '<clock-demo></clock-demo>'
export const Mouse =  () => '<mouse-demo></mouse-demo'
export const Iterator =  () => '<iterator-demo/>'
export const Interval =  () => '<interval-demo></iterator-demo>'
