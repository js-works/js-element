import { h, stateful } from '../../main/js-elements'
import { withTime } from '../../main/js-elements-ext'

stateful('clock-demo', (c) => {
  const getTime = withTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
