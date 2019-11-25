import { h, component, useState, useOnMount } from '../../src/index'

const MouseDemo = component('Demo', {
  main(c) {
    const mousePos = useMousePosition(c)

    return () => {
      return mousePos.x === -1
        ? <div>Please move mouse ...</div>
        : (
          <div>
            Current mouse position: {mousePos.x}x{mousePos.y}
          </div>
        )
    }
  }
})

function useMousePosition(c) {
  const
    [mousePos, setMousePos] = useState(c, { x: -1, y: -1 })

  useOnMount(c, () => {
    const listener = ev => {
      setMousePos({ x: ev.pageX, y: ev.pageY })
    }

    window.addEventListener('mousemove', listener)

    return () => {
      window.removeEventListener('mousemove', listener)
    }
  })

  return mousePos
}

MouseDemo.register('mouse-demo')
