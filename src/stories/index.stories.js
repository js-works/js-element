import '@webcomponents/webcomponentsjs'

import './demos/styles/todomvc-base.css'
import './demos/styles/todomvc-app.css'

import './demos/button-demo'
import './demos/simple-counter-demo'
import './demos/complex-counter-demo'
import './demos/clock-demo'
import './demos/iterator-demo'
import './demos/mouse-demo'
import './demos/slots-demo'
import './demos/provision-demo'
import './demos/interval-demo'
import './demos/promise-demo'
import './demos/store-demo'
import './demos/todo-mvc'
import './styles.css'

export default {
  title: 'Demos'
}

export const Button = () => '<button-demo></button-demo>'

export const SimpleCounter = () => '<simple-counter-demo></simple-counter-demo>'
export const ComplexCounter = () =>
  '<complex-counter-demo></complex-counter-demo>'
export const Clock = () => '<clock-demo></clock-demo>'
export const Mouse = () => '<mouse-demo></mouse-demo>'
export const Slots = () => '<slots-demo></slots-demo>'

export const Provision = () => '<provision-demo></provision-demo'
export const Iterator = () => '<iterator-demo/>'
export const Interval = () => '<interval-demo></iterator-demo>'
export const Promises = () => '<promise-demo></promise-demo>'
export const Stores = () => '<store-demo></store-demo>'

export const TodoMvc = () => `
  <div class="todoapp">
    <todo-mvc></todo-mvc>
  </div>
`
