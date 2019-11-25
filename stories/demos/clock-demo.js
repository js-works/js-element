import { htm, component, useTime } from '../../src/index'

const ClockDemo = component('Clock', {
  main(c) {
    const time = useTime(c, 1000, () => new Date().toLocaleTimeString())

    return () => htm` 
      <div>
        Current time: ${time.value}
      </div>
    `
  }
})

ClockDemo.register('clock-demo')
