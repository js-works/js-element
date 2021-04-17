import { define, h } from 'js-element'
import { hook, useState, useAfterMount } from 'js-element/hooks'

export default define('mouse-demo', () => {
  const mousePos = useMousePosition()

  return () => {
    if (mousePos.x < 0) {
      return <div>Please move mouse ...</div>
    }

    return (
      <div>
        Current mouse position: {mousePos.x}x{mousePos.y}
      </div>
    )
  }
})

const useMousePosition = hook('useMousePosition', () => {
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 })

  useAfterMount(() => {
    const listener = (ev: any) => {
      setMousePos({ x: ev.pageX, y: ev.pageY })
    }

    window.addEventListener('mousemove', listener)

    return () => {
      window.removeEventListener('mousemove', listener)
    }
  })

  return mousePos
})
