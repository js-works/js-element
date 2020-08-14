import { h, stateful } from '../../main/js-elements'
import { useTime } from '../../main/js-elements-ext'

stateful('clock-demo', (c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
