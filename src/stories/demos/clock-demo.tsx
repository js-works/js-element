import { component, element, h } from 'js-elements'
import { useTime } from 'js-elements/hooks'

@element('clock-demo')
export default class ClockDemo {
  static main() {
    const getTime = useTime(1000, () => new Date().toLocaleTimeString())

    return () => <div>Current time: {getTime()}</div>
  }
}
