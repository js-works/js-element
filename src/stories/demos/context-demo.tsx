import { element, html } from 'js-elements'
import { createContextHooks, useCtx, useInterval } from 'js-elements/hooks'

const [useThemeProvider, useTheme] = createContextHooks('theme', 'light')

@element('context-demo')
export default class ContextDemo {
  static main() {
    let theme = 'light'
    const setTheme = useThemeProvider()

    setTheme('light')

    useInterval(() => {
      theme = theme === 'light' ? 'dark' : 'light'
      setTheme(theme)
    }, 1000)

    return () => html`
      <div>
        <b>Value for theme will change every second:</b>
        <br />
        <${ThemeInfo} />
      </div>
    `
  }
}

@element('theme-info')
class ThemeInfo {
  static main() {
    const getTheme = useTheme()
    return () => html`<div>Current theme: ${getTheme()}</div>`
  }
}
