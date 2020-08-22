/** @jsx h */
import { h, stateful } from '../../main/js-elements'
import { $mousePosition } from '../../main/js-elements-ext'

stateful('mouse-demo', (c) => {
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
