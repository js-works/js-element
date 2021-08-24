import CounterDemo from './demos/counter-demo'

export default {
  title: 'Demos'
}

function demo(demoClass: any) {
  const tagName = demoClass.tagName
  return () =>
    `<div><${tagName}></${tagName}></div><br><div id="message"></div>`
}

export const Test = demo(CounterDemo)
