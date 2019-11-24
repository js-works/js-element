import { component, prop, htm } from '../src/index.js'

const Counter = component({
  displayName: 'Juhu',

  properties: {
    a: prop.str.nul.opt('A'),
    b: prop.num.req()
  },
  
  render() {
    return htm`<b>Juhu</b>`
  }
})

customElements.define('my-counter', Counter)
document.getElementById('app').innerHTML = '<my-counter a="B"/>'