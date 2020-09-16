import { component, h, prop, VNode } from 'js-elements'

const prefs = {
  framesPerSecond: 240,
  colors: ['red', 'yellow', 'orange'],
  tileWidth: 5,
  columnCount: 20,
  rowCount: 20
}

const Tile = component('x-tile')({
  props: {
    color: prop.str.opt('white'),
    width: prop.num.opt(3)
  }
})((c, props) => {
  return () => {
    /*
    const style = {
      float: 'left',
      width: props.width + 'px',
      height: props.width + 'px',
      backgroundColor: props.color,
      padding: 0,
      margin: 0
    }
    */
    const style = `
      float: left;
      width: ${props.width}px;
      height: ${props.width}px;
      background-color: ${props.color};
      padding: 0;
      margin: 0;
    `

    return <div style={style as any} /> // TODO
  }
})

const TileRow = component('x-tile-row')({
  props: {
    tileWidth: prop(Number).opt(3),
    columnCount: prop.num.opt(prefs.columnCount),
    colors: prop.obj.opt(prefs.colors as any), // TODO!!!!
    loop: prop.num.req() // TODO!!!
  }
})((c, props) => {
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

const SpeedTest = component('x-speed-test')({
  props: {
    columnCount: prop.num.opt(prefs.columnCount),
    rowCount: prop.num.opt(prefs.rowCount),
    tileWidth: prop.num.opt(3),
    framesPerSecond: prop.num.opt(prefs.framesPerSecond)
  }
})((c, props) => {
  let loop = 0

  let intervalId = null as any,
    startTime = Date.now(),
    frameCount = 0,
    actualFramesPerSecond = '0'

  /*
    const style = {
      marginTop: 40,
      marginLeft: 40
    }
    */

  const style = 'margin-top: 40px; margin-left: 40px'

  c.effect(() => {
    intervalId = setInterval(() => {
      ++frameCount

      if (frameCount % 10 === 0) {
        actualFramesPerSecond = (
          (frameCount * 1000.0) /
          (Date.now() - startTime)
        ).toFixed(2)
      }

      c.refresh()
    }, 1000 / props.framesPerSecond)

    return () => clearInterval(intervalId)
  }, null)

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

component('performance-demo', () => {
  return () => (
    <SpeedTest
      tileWidth={prefs.tileWidth}
      columnCount={prefs.columnCount}
      rowCount={prefs.rowCount}
    />
  )
})
