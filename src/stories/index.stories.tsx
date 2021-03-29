import ButtonDemo from './demos/button-demo'
import SimpleCounterDemo from './demos/simple-counter-demo'
import LitCounterDemo from './demos/lit-counter-demo'
import UhtmlCounterDemo from './demos/uhtml-counter-demo'
import ComplexCounterDemo from './demos/complex-counter-demo'
import StoreCounterDemo from './demos/store-counter-demo'
import ClockDemo from './demos/clock-demo'
import IntervalDemo from './demos/interval-demo'
import MouseDemo from './demos/mouse-demo'
import PromiseDemo from './demos/promise-demo'
import ContextDemo from './demos/context-demo'
import PerformanceDemo from './demos/performance-demo'
import GameDemo from './demos/game-demo'
import SierpinskiDemo from './demos/sierpinski-demo'
import TempDemo from './demos/temp-demo'

export default {
  title: 'Demos'
}

function demo(demoClass: any) {
  const tagName = demoClass.tagName
  return () =>
    `<div><${tagName}></${tagName}></div><br><div id="message"></div>`
}

export const Button = demo(ButtonDemo)
export const SimpleCounter = demo(SimpleCounterDemo)
export const LitCounter = demo(LitCounterDemo)
export const HmtlCounter = demo(UhtmlCounterDemo)
export const ComplexCounter = demo(ComplexCounterDemo)
export const StoreCounter = demo(StoreCounterDemo)
export const Clock = demo(ClockDemo)
export const Interval = demo(IntervalDemo)
export const Mouse = demo(MouseDemo)
export const Promise = demo(PromiseDemo)
export const Context = demo(ContextDemo)
export const Performance = demo(PerformanceDemo)
export const Game = demo(GameDemo)
export const SierpinskiTriangle = demo(SierpinskiDemo)
export const Temp = demo(TempDemo)
