import { define, h } from 'js-elements'
import { useTime } from 'js-elements/hooks'

export default define('clock-demo', () => {
  const getTime = useTime(1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
