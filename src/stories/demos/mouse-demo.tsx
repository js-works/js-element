import { element, h } from 'js-elements'
import { useMousePosition } from 'js-elements/hooks'

@element('mouse-demo')
export default class MouseDemo {
  static main() {
    const mousePos = useMousePosition()

    return () => {
      if (!mousePos.isValid()) {
        return <div>Please move mouse ...</div>
      } else {
        return (
          <div>
            Current mouse position: {mousePos.getX()}x{mousePos.getY()}
          </div>
        )
      }
    }
  }
}
