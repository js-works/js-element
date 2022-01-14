import { createCtx, elem, prop, Attrs } from 'js-element'
import { useCtx, useInterval, useState } from 'js-element/hooks'
import { html, lit } from 'js-element/lit'

const themeCtx = createCtx('light')

@elem({
  tag: 'theme-provider',
  ctx: themeCtx
})
class ThemeProvider extends HTMLElement {
  @prop({ attr: Attrs.string })
  value?: string
}

@elem({
  tag: 'theme-info',
  impl: lit(implThemeInfo)
})
class ThemeInfo extends HTMLElement {}

function implThemeInfo() {
  const ctx = useCtx({ theme: themeCtx })

  return () => html`<div>Current theme: ${ctx.theme}</div>`
}

@elem({
  tag: 'context-demo',
  uses: [ThemeProvider, ThemeInfo],
  impl: lit(contextDemoImpl)
})
class ContextDemo extends HTMLElement {}

function contextDemoImpl(self: ContextDemo) {
  const [state, setState] = useState({ theme: 'light' })

  useInterval(() => {
    setState('theme', (it) => (it === 'light' ? 'dark' : 'light'))
  }, 1000)

  return () => html`
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <theme-provider value=${state.theme}>
        <theme-info></theme-info>
      </theme-provider>
    </div>
  `
}

export default ContextDemo
