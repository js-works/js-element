/** @jsx h */
import { h, component } from '../../main/js-elements'
import { $mousePosition } from '../../main/js-elements-ext'

component('mouse-demo', (c) => {
  const mousePos = $mousePosition(c)

  return () =>
    mousePos.x === -1 ? (
      <div>Please move mouse ...</div>
    ) : (
      <div>
        Current mouse position: {mousePos.x}x{mousePos.y}
      </div>
    )
})
