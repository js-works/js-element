
const alreadyAddedSheets = {}

export default function addStyleSheet(name, styleSheet) {
  if (!Object.prototype.hasOwnProperty.call(alreadyAddedSheets, name)) {
    const styleElem = document.createElement('style')

    styleElem.setAttribute('id', `jsc:stylesheet:${name}`)
    styleElem.appendChild(document.createTextNode(styleSheet))
    document.head.appendChild(styleElem)
    alreadyAddedSheets[name] = true
  }
}
