import { component, element, h, prop } from 'js-elements'
import { useOnMount, useRefresher } from 'js-elements/hooks'
import { VNode } from 'js-elements/types'

const prefs = {
  framesPerSecond: 240,
  colors: ['red', 'yellow', 'orange'],
  tileWidth: 5,
  columnCount: 20,
  rowCount: 20
}

@element('x-tile')
class _Tile {
  @prop()
  color = 'white'

  @prop()
  width = 3

  static main(self: _Tile) {
    return () => {
      const style = `
        float: left;
        width: ${self.width}px;
        height: ${self.width}px;
        background-color: ${self.color};
        padding: 0;
        margin: 0;
      `

      return <div style={style} />
    }
  }
}

@element('x-tile-row')
class _TileRow {
  @prop()
  tileWidth = 3

  @prop()
  columnCount = 3

  @prop()
  colors = prefs.colors

  @prop()
  loop = 0

  static main(self: _TileRow) {
    return () => {
      const tiles = []

      for (let x = 0; x < self.columnCount; ++x) {
        const colorIdx = Math.floor(Math.random() * self.colors.length)
        const color = self.colors[colorIdx]

        tiles.push(<Tile width={self.tileWidth} color={color} key={x} />)
      }

      return <div style="clear: both">{tiles}</div>
    }
  }
}

@element('x-speed-test')
class _SpeedTest {
  @prop()
  columnCount = prefs.columnCount

  @prop()
  rowCount = prefs.rowCount

  @prop()
  tileWidth = 3

  @prop()
  framesPerSecond = prefs.framesPerSecond

  static main(self: _SpeedTest) {
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
      }, 1000 / self.framesPerSecond)

      return () => clearInterval(intervalId)
    })

    return () => {
      const rows: VNode[] = []

      for (let y = 0; y < self.rowCount; ++y) {
        rows.push(
          <TileRow
            tileWidth={self.tileWidth}
            columnCount={self.columnCount}
            key={y}
            loop={loop++}
          />
        )
      }

      return (
        <div>
          <div>
            Rows: {self.rowCount}, columns: {self.columnCount}
            <div style={style}>{rows}</div>
          </div>
          <br />
          <div style="clear: both">
            (actual frames per second: {actualFramesPerSecond})
          </div>
        </div>
      )
    }
  }
}

@element('performance-demo')
export default class PerformanceDemo {
  static main() {
    return () => (
      <SpeedTest
        tileWidth={prefs.tileWidth}
        columnCount={prefs.columnCount}
        rowCount={prefs.rowCount}
      />
    )
  }
}

const Tile = component(_Tile)
const TileRow = component(_TileRow)
const SpeedTest = component(_SpeedTest)
