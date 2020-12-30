import ButtonDemo from './demos/button-demo'
import SimpleCounterDemo from './demos/simple-counter-demo'
import ComplexCounterDemo from './demos/complex-counter-demo'
import ClockDemo from './demos/clock-demo'
import IntervalDemo from './demos/interval-demo'
import MouseDemo from './demos/mouse-demo'
import PromiseDemo from './demos/promise-demo'
import ContextDemo from './demos/context-demo'
import PerformanceDemo from './demos/performance-demo'
import PogoDemo from './demos/pogo-demo'

export default {
  title: 'Demos'
}

function demo(demoClass: any) {
  const tagName = demoClass[Symbol.for('tagName')]
  return () => `<${tagName}></${tagName}`
}

export const Button = demo(ButtonDemo)
export const SimpleCounter = demo(SimpleCounterDemo)
export const ComplexCounter = demo(ComplexCounterDemo)
export const Clock = demo(ClockDemo)
export const Interval = demo(IntervalDemo)
export const Mouse = demo(MouseDemo)
export const Promise = demo(PromiseDemo)
export const Context = demo(ContextDemo)
export const Performance = demo(PerformanceDemo)
export const Game = demo(PogoDemo)
