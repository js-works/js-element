import {
  component,
  h,
  prop,
  provision,
  render,
  Html,
  Svg
} from '../../main/index'
export { crankComponent as component, h, prop, provision, render, Html, Svg }

function crankComponent(name, configOrFunc) {
  let ret

  if (typeof configOrFunc === 'function') {
    ret = component(name, {
      view: convertFromCrankComponent(configOrFunc)
    })
  } else {
    const mappedConfig = {
      ...configOrFunc,
      view: convertFromCrankComponent(configOrFunc.main)
    }

    delete mappedConfig.main
    ret = component(name, mappedConfig)
  }

  return ret
}

function convertToCrankContext(c) {
  return {
    isMounted: () => c.isMounted(),
    refresh: () => c.refresh(),

    // Be careful: These listeners will not automatically be removed
    // with "normal" crank functions! Only with generators!
    // Not really that important for this simple demo.
    addEventListener: (...args) => c.getElement().addEventListener(...args),

    removeEventListener: (...args) =>
      c.getElement().removeEventListener(...args)
  }
}

function convertFromCrankComponent(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a crank function, got something else')
  }

  if (fn.constructor !== Function && fn.constructor !== GeneratorFunction) {
    throw new TypeError('Sorry, only synchronous crank functions supported yet')
  }

  if (fn.constructor === Function) {
    return (c) => {
      const context = convertToCrankContext(c)
      return (props) => fn.apply(context, props)
    }
  }

  // Sync generator
  return function (c, getProps) {
    const context = convertToCrankContext(c)
    const gen = fn.call(context, getProps())

    return () => {
      const content = gen.next(getProps())

      console.log('content', content)
      return content
    }
  }
}

const GeneratorFunction = function* () {}.constructor
