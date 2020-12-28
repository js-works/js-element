/** @jsx h */
import { component, h } from 'js-elements'
import { useMousePosition } from 'js-elements/hooks'

component('mouse-demo', (c) => {
  const mousePos = useMousePosition(c)

  return () =>
    mousePos.x === -1 ? (
      <div>Please move mouse ...</div>
    ) : (
      <div>
        Current mouse position: {mousePos.x}x{mousePos.y}
      </div>
    )
})
