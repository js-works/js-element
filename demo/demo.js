import { component, prop, htm } from '../src/index.js'

const Counter = component('Counter', {
  properties: {
    a: prop.str.nul.opt('A'),
    b: prop.num.req()
  },
  
  main(c, props) {
    let count = 0

    setInterval(() => {console.log(count)
      ++count
      c.refresh()
    }, 1000)

    return () =>
      htm`<b>${count}</b>`
  }
})

customElements.define('my-counter', Counter)
document.getElementById('app').innerHTML = '<my-counter a="B"/>'