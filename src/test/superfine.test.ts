import { h, patch } from '../main/lib/superfine'

// === DOM helpers ===================================================

const dom = (() => {
  const container = document.createElement('div')

  return {
    clear() {
      container.innerHTML = ''
    },

    getNode(query?: string): Node | null {
      return !query ? container : container.querySelector(query)
    },

    getInner(query?: string): string | null {
      const elem = this.getNode(query)
      return elem instanceof Element ? elem.innerHTML : null
    },

    render(content: ReturnType<typeof h>) {
      if (!container.firstChild) {
        container.innerHTML = '<div></div>'
      }

      patch(container.firstChild, content)
    }
  }
})()

// === ref helpers ===================================================

function createRefObject<T = any>(): {
  current: T | null
  previous: T | null
} {
  let current: T | null = null
  let previous: T | null = null

  return {
    get current() {
      return current
    },

    set current(value: T | null) {
      previous = current
      current = value
    },

    get previous() {
      return previous
    }
  }
}

function createRefCallback<T = any>(): {
  (value: T | null): void
  current: T | null
  previous: T | null
} {
  let current: T | null = null
  let previous: T | null = null

  const ret: any = (value: T) => {
    previous = current
    current = value
  }

  Object.defineProperties(ret, {
    current: { get: () => current },
    previous: { get: () => previous }
  })

  return ret
}

// === dom helper object tests =======================================

test('test dom helper object', () => {
  dom.clear()
  expect(dom.getInner()).toBe('')

  dom.render(h('div', { id: 'test' }, [h('br')]))
  expect(dom.getInner()).toBe('<div id="test"><br></div>')
  expect(dom.getInner('#test')).toBe('<br>')
  expect(dom.getNode()).toBeInstanceOf(HTMLDivElement)
  expect(dom.getNode('br')).toBeInstanceOf(HTMLBRElement)
})

// === ref helper tests ==============================================

test('test createRefObject helper function', () => {
  const refObject = createRefObject()
  expect(refObject.current).toBeNull()
  expect(refObject.previous).toBeNull()

  refObject.current = 11
  expect(refObject.current).toBe(11)
  expect(refObject.previous).toBe(null)

  refObject.current = 22
  expect(refObject.current).toBe(22)
  expect(refObject.previous).toBe(11)
})

test('test createRefObject helper function', () => {
  const refCallback = createRefCallback()
  expect(refCallback.current).toBeNull()
  expect(refCallback.previous).toBeNull()

  refCallback(111)
  expect(refCallback.current).toBe(111)
  expect(refCallback.previous).toBe(null)

  refCallback(222)
  expect(refCallback.current).toBe(222)
  expect(refCallback.previous).toBe(111)
})

test('test createRefCallback helper function', () => {
  const refCallback = createRefCallback()
})

// === ref tests =====================================================

test('test whether refs are set/called properly', () => {
  const refObject = createRefObject()
  const refCallback = createRefCallback()

  dom.render(h('div', { ref: refObject }))
  expect(refObject.current).toBeInstanceOf(HTMLDivElement)

  dom.render(h('input', { ref: refCallback }))
  expect(refObject.current).toBeNull()
  expect(refCallback.current).toBeInstanceOf(HTMLInputElement)

  dom.render(h('input', { ref: refCallback }))
  expect(refCallback.current).toBeInstanceOf(HTMLInputElement)
})
