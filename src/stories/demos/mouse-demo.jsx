import { html, component, useState, useEffect } from '../../main/index'

component('mouse-demo', {
  main(c) {
    const mousePos = useMousePosition(c)

    return () => {
      return mousePos.x === -1
        ? html`<div>Please move mouse ...</div>`
        : html`
            <div>
              Current mouse position: ${mousePos.x}x${mousePos.y}
            </div>
          `
    }
  }
})

function useMousePosition(c) {
  const
    [mousePos, setMousePos] = useState(c, { x: -1, y: -1 })

  useEffect(c, () => {
    const listener = ev => {
      setMousePos({ x: ev.pageX, y: ev.pageY })
    }

    window.addEventListener('mousemove', listener)

    return () => {
      window.removeEventListener('mousemove', listener)
    }
  }, null)

  return mousePos
}
