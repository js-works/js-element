export default class Css {
  constructor(styleSheet) {
    this.type = 'css'
    this.styleSheet = styleSheet
    this.styleElement = document.createElement('div')
    this.styleElement.appendChild(document.createTextNode(styleSheet))
    
    this.id = Number(Math.floor(Math.random() * 1000000000)).toString(16)
      + '-' + ++instanceCounter
    
    Object.freeze(this)
  }
}

let instanceCounter = 0