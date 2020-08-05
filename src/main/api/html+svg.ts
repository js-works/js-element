import { h } from './core'

export { Html, Svg }

const Html = createDomFactoryObject()
const Svg = createDomFactoryObject()

function createDomFactoryObject() {
  const handler = {
    get(target: object, propName: string) {
      const factory = h.bind(null, propName)
      ret[propName] = factory
      return factory
    }

    // TODO: other handler methods?
  }

  const ret: any = new Proxy({}, handler)
  return ret
}
