import { h, stateful } from '../../main/js-elements'
import { $time } from '../../main/js-elements-ext'

stateful('clock-demo', (c) => {
  const getTime = $time(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
