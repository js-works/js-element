import { html, render, TemplateResult } from './libs/lit-html'
import { createAdaption, prop, provision } from './core/core'

// === exports =======================================================

export { defineElement, html, prop, provision, TemplateResult }

// === defineElement =================================================

const defineElement = createAdaption<TemplateResult, void>(render)
