/** @jsx h */
import { component, h } from 'js-elements'
import { withMousePosition } from 'js-elements/ext'

component('mouse-demo', (c) => {
  const mousePos = withMousePosition(c)

  return () =>
    mousePos.x === -1 ? (
      <div>Please move mouse ...</div>
    ) : (
      <div>
        Current mouse position: {mousePos.x}x{mousePos.y}
      </div>
    )
})
