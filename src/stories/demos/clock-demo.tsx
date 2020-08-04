import { defineElement, html } from '../../main/js-elements'
import { withTime } from '../../main/js-elements-ext'

defineElement('clock-demo', (c) => {
  const getTime = withTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => html`Current time: ${getTime()}`
})
