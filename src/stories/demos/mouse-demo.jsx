import { html, component, useValues, useEffect } from '../../main/index'

component('mouse-demo', () =>  {
  const mousePos = useMousePosition()

  return () => {
    return mousePos.x === -1
      ? html`<div>Please move mouse ...</div>`
      : html`
          <div>
            Current mouse position: ${mousePos.x}x${mousePos.y}
          </div>
        `
  }
})

function useMousePosition() {
  const [mousePos, setMousePos] = useValues({ x: -1, y: -1 })

  useEffect(() => {
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
