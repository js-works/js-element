
const alreadyAddedSheets = {}

export default function addStyleSheet(styleSheet) {
  if (!Object.prototype.hasOwnProperty.call(alreadyAddedSheets, styleSheet)) {
    const styleElem = document.createElement('style')
    
    styleElem.innerText = styleSheet
    document.head.appendChild(styleElem)
    alreadyAddedSheets[styleSheet] = true
  }

  alreadyAddedSheets[styleSheet] = true
}