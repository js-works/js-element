import { defineElement, html } from '../../main/js-elements-lit-html'
import { useTime } from '../../main/js-elements-ext'

defineElement('clock-demo', (c) => {
  const getTime = useTime(c, 1000, () => new Date().toLocaleTimeString())

  return () => html`Current time: ${getTime()}`
})
