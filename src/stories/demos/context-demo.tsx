import { elem, h } from 'js-elements'
import { createCtxHooks, useInterval } from 'js-elements/hooks'

const [useThemeProvider, useTheme] = createCtxHooks('theme', 'light')

const ContextDemo = elem('context-demo', () => {
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

const ThemeInfo = elem('theme-info', () => {
  const getTheme = useTheme()
  return () => <div>Current theme: {getTheme()}</div>
})

export default ContextDemo
