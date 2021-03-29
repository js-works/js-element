import { h, patch } from '../main/lib/superfine'

// === DOM helper object =============================================

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
    //console.log('------- callback -----------', value)
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

describe('dom helper object (only needed for testing)', () => {
  it('should be clearable', () => {
    dom.render(h('div'))
    dom.clear()
    expect(dom.getInner()).toBe('')
  })

  it('should render properly', () => {
    dom.render(h('div', { id: 'test' }, [h('br')]))
    expect(dom.getInner()).toBe('<div id="test"><br></div>')
  })

  it('should return inner html of selected subelement', () => {
    dom.render(h('div', { id: 'test' }, [h('span')]))
    expect(dom.getInner('#test')).toBe('<span></span>')
  })

  it('should return the base node', () => {
    dom.render(h('div'))
    expect(dom.getNode()).toBeInstanceOf(HTMLDivElement)
  })

  it('should select and return a subnode', () => {
    dom.render(h('div', { id: 'test' }, [h('a')]))
    expect(dom.getNode('a')).toBeInstanceOf(HTMLAnchorElement)
  })
})

// === ref helper tests ==============================================

describe('Ref helper functions (only needed for testing)', () => {
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

    refObject.current = 33
    expect(refObject.current).toBe(33)
    expect(refObject.previous).toBe(22)
  })

  test('test createRefObject helper function', () => {
    const refCallback = createRefCallback()
    expect(refCallback.current).toBeNull()
    expect(refCallback.previous).toBeNull()

    refCallback(111)
    expect(refCallback.current).toBe(111)
    expect(refCallback.previous).toBeNull()

    refCallback(222)
    expect(refCallback.current).toBe(222)
    expect(refCallback.previous).toBe(111)

    refCallback(333)
    expect(refCallback.current).toBe(333)
    expect(refCallback.previous).toBe(222)
  })
})

// === ref tests =====================================================

describe('Ref object and ref callbacks', () => {
  test('test whether refs are set/called properly', () => {
    const refObject = createRefObject()
    const refCallback = createRefCallback()

    dom.render(h('div', { ref: refObject }))
    expect(refObject.current).toBeInstanceOf(HTMLDivElement)
    expect(refObject.previous).toBeNull()
    expect(refCallback.current).toBeNull()
    expect(refCallback.previous).toBeNull()

    dom.render(h('input', { ref: refCallback }))
    expect(refObject.current).toBeNull()
    expect(refObject.previous).toBeInstanceOf(HTMLDivElement)
    expect(refCallback.current).toBeInstanceOf(HTMLInputElement)
    expect(refCallback.previous).toBeNull()

    dom.render(h('input', { ref: refCallback }))
    expect(refObject.current).toBeNull()
    expect(refObject.previous).toBeInstanceOf(HTMLDivElement)
    expect(refCallback.current).toBeInstanceOf(HTMLInputElement)
    expect(refCallback.previous).toBeNull()

    dom.render(h('button', { ref: refObject }))
    expect(refObject.current).toBeInstanceOf(HTMLButtonElement)
    expect(refObject.previous).toBeNull()
    expect(refCallback.current).toBeNull()
    expect(refCallback.previous).toBeInstanceOf(HTMLInputElement)

    dom.render(h('button', { ref: refCallback }))
    expect(refObject.current).toBeNull()
    expect(refObject.previous).toBeInstanceOf(HTMLButtonElement)
    expect(refCallback.current).toBeInstanceOf(HTMLButtonElement)
    expect(refCallback.previous).toBeNull()

    dom.render(h('input', { ref: refCallback }))
    expect(refObject.current).toBeNull()
    expect(refObject.previous).toBeInstanceOf(HTMLButtonElement)
    expect(refCallback.current).toBeInstanceOf(HTMLInputElement)
    expect(refCallback.previous).toBeNull()
  })
})
