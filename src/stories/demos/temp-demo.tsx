import { define, h, ref, render } from 'js-element'
import { useEffect, useMutable } from 'js-element/hooks'

const TempDemo = define('temp-demo', () => {
  const state = useMutable({ clicked: false })
  const buttonRef = ref<HTMLButtonElement>()

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
