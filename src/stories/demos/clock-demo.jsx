/** @jsx h */
import { h, html, component, useTime } from '../../main/index'

component('clock-demo', c => {
  const time = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => (
    <div>
      Current time: {time.value}
    </div>
  )
  /*
  return () => html`
    <div>
      Current time: ${time.value}
    </div>
  `
  */
})
