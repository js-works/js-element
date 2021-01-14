import { component, h, register } from 'js-elements'
import { useMousePosition } from 'js-elements/hooks'

const MouseDemo = component(() => {
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

register('mouse-demo', MouseDemo)

export default MouseDemo
