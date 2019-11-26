import { htm, component, useTime } from '../../src/index'

component('clock-demo', {
  main(c) {
    const time = useTime(c, 1000, () => new Date().toLocaleTimeString())

    return () => htm`
      <div>
        Current time: ${time.value}
      </div>
    `
  }
})
