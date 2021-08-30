import CounterDemo from './demos/counter-demo'
import ContextDemo from './demos/context-demo'

export default {
  title: 'Demos'
}

function demo(demoClass: any) {
  const tagName = demoClass.tagName
  return () =>
    `<div><${tagName}></${tagName}></div><br><div id="message"></div>`
}

export const counter = demo(CounterDemo)
export const context = demo(ContextDemo)
