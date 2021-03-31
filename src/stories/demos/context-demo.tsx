import { createContext, define, h } from 'js-element'
import { useConsumer, useInterval, useProvider } from 'js-element/hooks'

const ThemeCtx = createContext('theme', 'light')

const ContextDemo = define('context-demo', () => {
  let theme = 'light'
  const setTheme = useProvider(ThemeCtx)

  setTheme('light')

  useInterval(() => {
    theme = theme === 'light' ? 'dark' : 'light'
    setTheme(theme)
  }, 1000)

  return () => (
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <ThemeInfo />
    </div>
  )
})

const ThemeInfo = define('theme-info', () => {
  const getTheme = useConsumer(ThemeCtx)

  return () => <div>Current theme: {getTheme()}</div>
})

export default ContextDemo
