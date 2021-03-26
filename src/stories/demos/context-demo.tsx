import { define, h } from 'js-element/web'
import { createCtxHooks, useInterval } from 'js-element/hooks'

const [useThemeProvider, useTheme] = createCtxHooks('theme', 'light')

const ContextDemo = define('context-demo', () => {
  let theme = 'light'
  const setTheme = useThemeProvider()

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
  const getTheme = useTheme()
  return () => <div>Current theme: {getTheme()}</div>
})

export default ContextDemo
