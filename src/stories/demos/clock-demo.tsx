import { component, h } from 'js-elements'
import { useTimer } from 'js-elements/hooks'

const ClockDemo = component('clock-demo', () => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})

export default ClockDemo
