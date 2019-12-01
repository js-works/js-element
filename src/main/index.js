export { default as component } from './api/component'
export { default as prop } from './api/prop'
export { default as html } from './api/html'
export { default as supply } from './api/supply'
export { default as supplier } from './api/supplier'

// hooks
export { default as useEffect } from './api/useEffect'
export { default as useElementRef } from './api/useElementRef'
export { default as useInterval } from './api/useInterval'
export { default as useState } from './api/useState'
export { default as useTime } from './api/useTime'
export { default as useValue } from './api/useValue'

import registerCustomElement from './internal/registerCustomElement'

class UseStyles extends HTMLElement {
  static get observedAttributes() {
    return ['name']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') {
      const styleElem = document.getElementById(`styles::${newValue}`)
      
      if (!styleElem) {
        return
      }

      if (this.firstChild) {
        this.removeChild(this.firstChild)
      }

      const clonedElem = styleElem.cloneNode(true)
      clonedElem.removeAttribute('id')
      this.appendChild(clonedElem)
    }
  }
}

class UseAllGlobalStyles extends HTMLElement {
  constructor() {
    super()

    const styleElems = document.head.getElementsByTagName('style')

    styleElems.forEach(styleElem => {
      const clonedStyleElem = styleElem.cloneNode(true)
      clonedStyleElem.removeAttribute('id')
      this.appendChild(clonedStyleElem)
    })
  }
}

registerCustomElement('use-styles', UseStyles)
registerCustomElement('use-all-global-styles', UseAllGlobalStyles)
