import { createCtx, defineCtxProvider, define, h } from 'js-element'
import { useConsumer, useInterval, useState } from 'js-element/hooks'

const ThemeCtx = createCtx('theme', 'light')
const ThemeProvider = defineCtxProvider('theme-provider', ThemeCtx)

const ContextDemo = define('context-demo', () => {
  const state = useState({ theme: 'light' })

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
  const getTheme = useConsumer(ThemeCtx)

  return () => <div>Current theme: {getTheme()}</div>
})

export default ContextDemo
