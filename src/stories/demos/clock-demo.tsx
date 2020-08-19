import { h, component } from '../../main/js-elements'
import { withTime } from '../../main/js-elements-ext'

component('clock-demo', (c) => {
  const getTime = withTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
