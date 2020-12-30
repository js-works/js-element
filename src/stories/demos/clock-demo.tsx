import { define, h } from 'js-elements'
import { useTimer } from 'js-elements/hooks'

export default define('clock-demo', () => {
  const getTime = useTimer(1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
