import { component, h, register } from 'js-elements'
import { useTimer } from 'js-elements/hooks'

const ClockDemo = component(() => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})

register('clock-demo', ClockDemo)

export default ClockDemo
