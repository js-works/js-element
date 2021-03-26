import { define, h } from 'js-element/web'
import { useMousePosition } from 'js-element/hooks'

const MouseDemo = define('mouse-demo', () => {
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

export default MouseDemo
