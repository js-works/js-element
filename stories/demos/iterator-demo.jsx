import { h, component } from '../../src/index'

const demoContent = {
  [Symbol.iterator]: function * () {
    yield 'I'
    yield 't'
    yield 'e'
    yield 'r'
    yield 'a'
    yield 't'
    yield 'o'
    yield 'r'
    yield 's'

    yield {
      [Symbol.iterator]: function * () {
        yield ' '
        yield 'seem'
        yield ' '
        yield 'to'
        yield ' '
      }
    }

    yield 'w'
    yield 'o'
    yield ['r', 'k', ' ', 'p', {
      [Symbol.iterator]: function * () {
        yield 'r'
        yield 'operly!'
      }
    }]
  }
}

const IteratorDemo = component('IteratorDemo', {
  render () {
    return ( 
      <div>
        <div>
            If everything works fine then the following line shall be:
            "<i>Iterators seem to work properly!</i>"
        </div>
        <br/>
        <div>&gt;&gt; {demoContent}</div>
      </div>
    )
  }
})

IteratorDemo.register('iterator-demo')
