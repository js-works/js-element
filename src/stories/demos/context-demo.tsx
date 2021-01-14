import { component, h, register } from 'js-elements'
import { createCtxHooks, useInterval } from 'js-elements/hooks'

const [useThemeProvider, useTheme] = createCtxHooks('theme', 'light')

const ContextDemo = component(() => {
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

const ThemeInfo = component(() => {
  const getTheme = useTheme()
  return () => <div>Current theme: {getTheme()}</div>
})

register({
  'context-demo': ContextDemo,
  'theme-info': ThemeInfo
})

export default ContextDemo
