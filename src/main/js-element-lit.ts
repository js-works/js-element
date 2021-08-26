import { html, render, TemplateResult } from 'lit-html'
import { createRef, ref, Ref } from 'lit-html/directives/ref'
import { classMap } from 'lit-html/directives/class-map'
import { styleMap } from 'lit-html/directives/style-map'
import { repeat } from 'lit-html/directives/repeat'

// === exports =======================================================

export { classMap, createRef, html, ref, repeat, styleMap, withLit }
export { Ref, TemplateResult }

// === functions =====================================================

function withLit(init: Function): any {
  return {
    patch: render,
    init
  }
}
