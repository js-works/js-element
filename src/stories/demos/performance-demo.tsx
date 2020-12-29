import { define, h, prop } from 'js-elements'
import { useOnMount, useRefresher } from 'js-elements/hooks'
import { VNode } from 'js-elements/types'

const prefs = {
  framesPerSecond: 240,
  colors: ['red', 'yellow', 'orange'],
  tileWidth: 5,
  columnCount: 20,
  rowCount: 20
}

class TileProps {
  @prop()
  color = 'white'

  @prop()
  width = 3
}

const Tile = define('x-tile', TileProps, (props) => {
  return () => {
    const style = `
      float: left;
      width: ${props.width}px;
      height: ${props.width}px;
      background-color: ${props.color};
      padding: 0;
      margin: 0;
    `

    return <div style={style} />
  }
})

class TileRowProps {
  @prop()
  tileWidth = 3

  @prop()
  columnCount = 3

  @prop()
  colors = prefs.colors

  @prop()
  loop = 0
}

const TileRow = define('x-tile-row', TileRowProps, (props) => {
  return () => {
    const tiles = []

    for (let x = 0; x < props.columnCount; ++x) {
      const colorIdx = Math.floor(Math.random() * props.colors.length)
      const color = props.colors[colorIdx]

      tiles.push(<Tile width={props.tileWidth} color={color} key={x} />)
    }

    return <div style="clear: both">{tiles}</div>
  }
})

class SpeedTestProps {
  @prop()
  columnCount = prefs.columnCount

  @prop()
  rowCount = prefs.rowCount

  @prop()
  tileWidth = 3

  @prop()
  framesPerSecond = prefs.framesPerSecond
}

const SpeedTest = define('x-speed-test', SpeedTestProps, (props) => {
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
    }, 1000 / props.framesPerSecond)

    return () => clearInterval(intervalId)
  })

  return () => {
    const rows: VNode[] = []

    for (let y = 0; y < props.rowCount; ++y) {
      rows.push(
        <TileRow
          tileWidth={props.tileWidth}
          columnCount={props.columnCount}
          key={y}
          loop={loop++}
        />
      )
    }

    return (
      <div>
        <div>
          Rows: {props.rowCount}, columns: {props.columnCount}
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
