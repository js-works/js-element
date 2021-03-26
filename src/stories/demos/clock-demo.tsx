import { define, h } from 'js-element'
import { useTimer } from 'js-element/hooks'

const ClockDemo = define('clock-demo', () => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})

export default ClockDemo
