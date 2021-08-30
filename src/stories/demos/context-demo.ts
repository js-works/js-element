import { component, createCtx, defineProvider, elem, prop } from 'js-element'
import { useCtx, useInterval, useState } from 'js-element/hooks'
import { html, withLit } from 'js-element/lit'

const ThemeCtx = createCtx('light')
const ThemeProvider = defineProvider('theme-provider', ThemeCtx)

@elem({
  tag: 'contxt-demo',
  impl: withLit(implContextDemo)
})
class ContextDemo extends component() {}

function implContextDemo(self: ContextDemo) {
  const [state, setState] = useState({ theme: 'light' })

  useInterval(() => {
    setState('theme', (it) => (it === 'light' ? 'dark' : 'light'))
  }, 1000)

  return () => html`
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <theme-provider .value=${state.theme}>
        <theme-info />
      </theme-provider>
    </div>
  `
}

@elem({
  tag: 'theme-info',
  impl: withLit(implThemeInfo)
})
class ThemeInfo extends component() {}

function implThemeInfo() {
  const ctx = useCtx({ theme: ThemeCtx })

  return () => html`<div>Current theme: ${ctx.theme}</div>`
}

export default ContextDemo
