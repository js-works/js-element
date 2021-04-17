import { createCtx, defineProvider, define, h } from 'js-element'
import { useCtx, useInterval, useReactive } from 'js-element/hooks'

const ThemeCtx = createCtx('light')
const ThemeProvider = defineProvider('theme-provider', ThemeCtx)

const ContextDemo = define('context-demo', () => {
  const state = useReactive({ theme: 'light' })

  useInterval(() => {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
  }, 1000)

  return () => (
    <div>
      <b>Value for theme will change every second:</b>
      <br />
      <ThemeProvider value={state.theme}>
        <ThemeInfo />
      </ThemeProvider>
    </div>
  )
})

const ThemeInfo = define('theme-info', () => {
  const ctx = useCtx({ theme: ThemeCtx })

  return () => <div>Current theme: {ctx.theme}</div>
})

export default ContextDemo
