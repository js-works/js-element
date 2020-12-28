import { component, provision, h } from 'js-elements'
import { useCtx, useInterval } from 'js-elements/hooks'

const [provideTheme, consumeTheme] = provision('theme', 'light')

component('provision-demo', (c) => {
  let theme = 'light'
  provideTheme(c, theme)

  useInterval(
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
  const ctx = useCtx(c, {
    theme: consumeTheme
  })

  return () => <div>Current theme: {ctx.theme}</div>
})
