import { define, h } from 'js-element'
import { useAfterMount, useRefresher, useState } from 'js-element/hooks'

const targetSize = 25

class DotProps {
  x = 0
  y = 0
  size = 1
  text = ''
}

const Dot = define('x-dot', DotProps, (p) => {
  const [s, set] = useState({ hover: false })
  const onMouseEnter = () => set('hover', true)
  const onMouseLeave = () => set('hover', false)

  return () => {
    const size = p.size * 1.3

    const style = `
      position: absolute;
      background: #61dafb;
      font: normal 15px sans-serif;
      text-align: center;
      cursor: pointer;
      width: ${size}px;
      height: ${size}px;
      left: ${p.x}px;
      top: ${p.y}px;
      border-radius: ${size / 2}px;
      line-height: ${size}px;
      background: ${s.hover ? '#ff0' : '#61dafb'};
    `

    return (
      <div
        style={style}
        onmouseenter={onMouseEnter}
        onmouseleave={onMouseLeave}
      >
        {s.hover ? `*${p.text}*` : p.text}
      </div>
    )
  }
})

class TriangleProps {
  x = 0
  y = 0
  size = 5
  text = ''
}

const Triangle = define('x-triangle', TriangleProps, (p) => {
  return () => {
    if (p.size <= targetSize) {
      return (
        <Dot
          x={p.x - targetSize / 2}
          y={p.y - targetSize / 2}
          size={targetSize}
          text={p.text}
        />
      )
    }

    const size = p.size / 2

    return (
      <span>
        <Triangle x={p.x} y={p.y - size / 2} size={size} text={p.text} />
        <Triangle x={p.x - size} y={p.y + size / 2} size={size} text={p.text} />
        <Triangle x={p.x + size} y={p.y + size / 2} size={size} text={p.text} />
      </span>
    )
  }
})

const Main = define('x-main', () => {
  const refresh = useRefresher()
  const start = Date.now()
  let seconds = 0

  useAfterMount(() => {
    const intervalId = setInterval(() => {
      seconds = (seconds % 10) + 1
    }, 1000)

    return () => clearInterval(intervalId)
  })

  useAfterMount(() => {
    requestAnimationFrame(function update() {
      refresh()
      requestAnimationFrame(update)
    })
  })

  return () => {
    const elapsed = Date.now() - start
    const t = (elapsed / 200) % 10
    const scale = 1 + (t > 5 ? 10 - t : t) / 10

    const style = `
        position: absolute;
        transformOrigin: 0 0;
        left: 50%;
        top: 50%;
        width: 10px;
        height: 10px;
        background: #eee;
        transform: scaleX(${scale / 2.1}) scaleY(0.7) translateZ(0.1px);
      `

    return (
      <div style={style}>
        <Triangle x={0} y={0} size={1000} text={String(seconds)} />
      </div>
    )
  }
})

export default Main
