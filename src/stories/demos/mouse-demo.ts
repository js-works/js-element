/** @jsx h */
import { defineElement, html } from '../../main/js-elements-lit-html'
import { useMousePosition } from '../../main/js-elements-ext'

defineElement('mouse-demo', (c) => {
  const mousePos = useMousePosition(c)

  return () =>
    mousePos.x === -1
      ? html`<div>Please move mouse ...</div>`
      : html`<div>Current mouse position: ${mousePos.x}x${mousePos.y}</div>`
})
