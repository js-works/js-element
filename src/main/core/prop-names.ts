// === exports =======================================================

export { PropNamesManager }

// === name converters ===============================================

function isEventPropName(name: string) {
  return name.match(/^on[A-Z][a-z0-9]*/)
}

function eventPropNameToEventName(eventPropName: string) {
  return eventPropName[2].toLowerCase() + eventPropName.substr(3)
}

function propNameToAttrName(propName: string) {
  return propName
    .replace(/(.)([A-Z])([A-Z]+)([A-Z])/g, '$1-$2$3-$4')
    .replace(/([a-z0-0])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// === PropNamesManager ==============================================

class PropNamesManager {
  private _propNames: Set<string> = new Set()
  private _attrNames: Set<string> = new Set()
  private _eventNames: Set<string> = new Set()
  private _eventPropNames: Set<string> = new Set()
  private _attrNameToPropNamesMap: Map<string, string> = new Map()
  private _eventPropNameToEventNameMap: Map<string, string> = new Map()

  constructor(propNamesMap: Map<string, boolean> | null) {
    if (propNamesMap) {
      for (const [propName, isAttribute] of propNamesMap.entries()) {
        this._propNames.add(propName)

        if (isAttribute) {
          const attrName = propNameToAttrName(propName)
          this._attrNames.add(attrName)
          this._attrNameToPropNamesMap.set(attrName, propName)
        }

        if (isEventPropName(propName)) {
          const eventName = eventPropNameToEventName(propName)
          this._eventPropNames.add(propName)
          this._eventNames.add(eventName)
          this._eventPropNameToEventNameMap.set(propName, eventName)
        }
      }
    }
  }

  getPropNames() {
    return this._propNames
  }

  getEventPropNames() {
    return this._eventPropNames
  }

  getEventNames() {
    return this._eventNames
  }

  attrNameToPropName(attrName: string): string {
    let ret = this._attrNameToPropNamesMap.get(attrName)

    if (!ret) {
      throw new Error(`Unknown attribute name "${attrName}"`)
    }

    return ret
  }

  getAttributNames() {
    return this._attrNames
  }

  isEventPropName(propName: string) {
    if (!this._propNames.has(propName)) {
      throw new Error(`Unknown props name "${propName}"`)
    }

    return isEventPropName(propName)
  }

  eventPropNameToEventName(eventPropName: string): string {
    const ret = this._eventPropNameToEventNameMap.get(eventPropName)

    if (!ret) {
      throw new Error(`Unknown event prop name "${eventPropName}"`)
    }

    return ret
  }
}
