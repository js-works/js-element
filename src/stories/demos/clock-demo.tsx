import { component, h } from 'js-elements'
import { useTime } from 'js-elements/hooks'

component('clock-demo')((c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => <div>Current time: {getTime()}</div>
})
