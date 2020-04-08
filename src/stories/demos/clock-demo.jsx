import { html, component, useTime } from '../../main/index'

component('clock-demo', () => {
  const time = useTime(1000, () => new Date().toLocaleTimeString())

  return () => html`
    <div>
      Current time: ${time.value}
    </div>
  `
})
