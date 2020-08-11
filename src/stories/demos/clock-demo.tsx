import { component, h } from '../../main/js-elements'
import { useTime } from '../../main/js-elements-ext'

component('clock-demo', (c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
