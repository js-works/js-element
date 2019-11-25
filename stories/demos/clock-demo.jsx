import { h, component, useTime } from '../../src/index'

const ClockDemo = component('Clock', {
  main(c) {
    const time = useTime(c, 1000, () => new Date().toLocaleTimeString())

    return () => ( 
      <div>
        Current time: {time.value}
      </div>
    )
  }
})

ClockDemo.register('clock-demo')
