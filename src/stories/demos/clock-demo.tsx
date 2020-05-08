/** @jsx h */
import { defineElement, h, useTime } from '../../main/index'

defineElement('clock-demo', c => {
  const time = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => (
    <div>
      Current time: {time.value}
    </div>
  )
})
