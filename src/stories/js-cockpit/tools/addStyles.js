
const alreadyAddedSheets = {}

export default function addStyles(name, styleSheet) {
  if (!Object.prototype.hasOwnProperty.call(alreadyAddedSheets, name)) {
    const styleElem = document.createElement('style')

    styleElem.setAttribute('id', `styles::${name}`)
    styleElem.appendChild(document.createTextNode(styleSheet))
    document.head.appendChild(styleElem)
    alreadyAddedSheets[name] = true
  }
}
