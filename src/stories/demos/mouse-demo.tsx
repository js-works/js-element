/** @jsx h */
import { h, stateful } from '../../main/js-elements'
import { withMousePosition } from '../../main/js-elements-ext'

stateful('mouse-demo', (c) => {
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
