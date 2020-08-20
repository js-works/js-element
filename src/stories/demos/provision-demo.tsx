import { provision, h, component } from '../../main/js-elements'
import { $interval } from '../../main/js-elements-ext'

const [provideTheme, consumeTheme] = provision('theme', 'light')

component('provision-demo', (c) => {
  let theme = 'light'
  provideTheme(c, theme)

  $interval(
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

const ThemeInfo = component('theme-info', {
  ctx: {
    theme: consumeTheme
  },

  render(_, ctx) {
    return <div>Current theme: {ctx.theme}</div>
  }
})
