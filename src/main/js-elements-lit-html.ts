import { html, render, TemplateResult } from './internal/lit-html'
import { createAdaption, prop, provision } from './api/core'

// === exports =======================================================

export { defineElement, html, prop, provision, TemplateResult }

// === defineElement =================================================

const defineElement = createAdaption<TemplateResult, void>(render)
