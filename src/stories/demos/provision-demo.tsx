import { defineElement, defineProvision, html } from '../../main/js-elements'
import { useInterval } from '../../main/js-elements-ext'

const [provideTheme, consumeTheme] = defineProvision('theme', 'light')

defineElement('provision-demo', (c) => {
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

  return () => html`
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <theme-info></theme-info>
    </div>
  `
})

defineElement('theme-info', {
  ctx: {
    theme: consumeTheme
  },

  render(_, ctx) {
    return html`<div>Current theme: ${ctx.theme}</div>`
  }
})
