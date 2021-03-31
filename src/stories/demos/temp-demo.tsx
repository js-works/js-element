import { define, h, createRef } from 'js-element'
import { useEffect, useState } from 'js-element/hooks'

const TempDemo = define('temp-demo', () => {
  const state = useState({ clicked: false })
  const buttonRef = createRef<HTMLButtonElement>()

  const onClick = () => (state.clicked = true)
  const onReset = () => (state.clicked = false)

  useEffect(() => {
    document.getElementById('message')!.innerText =
      'After rendering: Button ref is ' +
      (buttonRef.current ? 'set' : 'not set')
  })

  return () => (
    <div>
      {!state.clicked ? (
        <button ref={buttonRef} onclick={onClick}>
          Click me
        </button>
      ) : (
        <div>
          <input type="button" onclick={onReset} value="Reset"></input>
        </div>
      )}
    </div>
  )
})

export default TempDemo
