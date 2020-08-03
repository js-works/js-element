import { defineElement, html } from '../../main/index'
import { withTime } from '../extensions'

defineElement('clock-demo', (c) => {
  const getTime = withTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => html`Current time: ${getTime()}`
})
