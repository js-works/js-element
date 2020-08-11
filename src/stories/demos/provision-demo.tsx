import { component, provision, h } from '../../main/js-elements'
import { useInterval } from '../../main/js-elements-ext'

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
      <theme-info></theme-info>
    </div>
  )
})

component('theme-info', {
  ctx: {
    theme: consumeTheme
  },

  render(_, ctx) {
    return <div>Current theme: {ctx.theme}</div>
  }
})