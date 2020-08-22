import { h, stateless } from '../../main/js-elements'

const demoContent = {
  *[Symbol.iterator]() {
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
      [Symbol.iterator]: function* () {
        yield ' '
        yield 'seem'
        yield ' '
        yield 'to'
        yield ' '
      }
    }

    yield 'w'
    yield 'o'
    yield [
      'r',
      'k',
      ' ',
      'p',
      {
        [Symbol.iterator]: function* () {
          yield 'r'
          yield 'operly!'
        }
      }
    ]
  }
}

stateless('iterator-demo', () => {
  return (
    <div>
      <div>
        If everything works fine then the following line should be: "
        <i>Iterators seem to work properly!</i>"
      </div>
      <br />
      <div>&gt;&gt; {demoContent}</div>
    </div>
  )
})
