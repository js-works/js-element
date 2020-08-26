import { component, provision, h } from 'js-elements'
import { withCtx, interval } from 'js-elements/ext'

const [provideTheme, consumeTheme] = provision('theme', 'light')

component('provision-demo', (c) => {
  let theme = 'light'
  provideTheme(c, theme)

  interval(
    c,
    () => {
      theme = theme === 'light' ? 'dark' : 'light'
      provideTheme(c, theme)
    },
    1000
  )

  return () => (
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <ThemeInfo />
    </div>
  )
})

const ThemeInfo = component('theme-info', (c) => {
  const ctx = withCtx(c, {
    theme: consumeTheme
  })

  return () => <div>Current theme: {ctx.theme}</div>
})
