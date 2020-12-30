import { define, h } from 'js-elements'
import { useMousePosition } from 'js-elements/hooks'

export default define('mouse-demo', () => {
  const mousePos = useMousePosition()

  return () => {
    if (!mousePos.isValid()) {
      return <div>Please move mouse ...</div>
    }

    return (
      <div>
        Current mouse position: {mousePos.getX()}x{mousePos.getY()}
      </div>
    )
  }
})
