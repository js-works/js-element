import { html, render, TemplateResult } from './libs/lit-html'
import { createAdaption } from './core/core'
import { propConfigBuilder } from './core/propConfigBuilder'
import { provision } from './core/provision'

// === exports =======================================================

export {
  defineElement,
  html,
  propConfigBuilder as prop,
  provision,
  TemplateResult
}

// === defineElement =================================================

const defineElement = createAdaption<TemplateResult, void>(render)
