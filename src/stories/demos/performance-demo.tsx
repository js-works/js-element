import { define, h, VNode } from 'js-elements'
import { useOnMount, useRefresher } from 'js-elements/hooks'

const prefs = {
  framesPerSecond: 240,
  colors: ['red', 'yellow', 'orange'],
  tileWidth: 5,
  columnCount: 20,
  rowCount: 20
}

class TileP {
  color = 'white'
  width = 3
}

const Tile = define('x-tile', TileP, (p) => {
  return () => {
    const style = `
      float: left;
      width: ${p.width}px;
      height: ${p.width}px;
      background-color: ${p.color};
      padding: 0;
      margin: 0;
    `

    return <div style={style} />
  }
})

class TileRowP {
  tileWidth = 3
  columnCount = 3
  colors = prefs.colors
  loop = 0
}

const TileRow = define('x-tile-row', TileRowP, (p) => {
  return () => {
    const tiles = []

    for (let x = 0; x < p.columnCount; ++x) {
      const colorIdx = Math.floor(Math.random() * p.colors.length)
      const color = p.colors[colorIdx]

      tiles.push(<Tile width={p.tileWidth} color={color} key={x} />)
    }

    return <div style="clear: both">{tiles}</div>
  }
})

class SpeedTestP {
  columnCount = prefs.columnCount
  rowCount = prefs.rowCount
  tileWidth = 3
  framesPerSecond = prefs.framesPerSecond
}

const SpeedTest = define('x-speed-test', SpeedTestP, (p) => {
  let loop = 0

  let intervalId = null as any
  let startTime = Date.now()
  let frameCount = 0
  let actualFramesPerSecond = '0'

  const refresh = useRefresher()
  const style = 'margin-top: 40px; margin-left: 40px'

  useOnMount(() => {
    intervalId = setInterval(() => {
      ++frameCount

      if (frameCount % 10 === 0) {
        actualFramesPerSecond = (
          (frameCount * 1000.0) /
          (Date.now() - startTime)
        ).toFixed(2)
      }

      refresh()
    }, 1000 / p.framesPerSecond)

    return () => clearInterval(intervalId)
  })

  return () => {
    const rows: VNode[] = []

    for (let y = 0; y < p.rowCount; ++y) {
      rows.push(
        <TileRow
          tileWidth={p.tileWidth}
          columnCount={p.columnCount}
          key={y}
          loop={loop++}
        />
      )
    }

    return (
      <div>
        <div>
          Rows: {p.rowCount}, columns: {p.columnCount}
          <div style={style}>{rows}</div>
        </div>
        <br />
        <div style="clear: both">
          (actual frames per second: {actualFramesPerSecond})
        </div>
      </div>
    )
  }
})

export default define('performance-demo', () => {
  return () => (
    <SpeedTest
      tileWidth={prefs.tileWidth}
      columnCount={prefs.columnCount}
      rowCount={prefs.rowCount}
    />
  )
})
