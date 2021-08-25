import { html, render } from 'lit-html'
import { createRef, ref, Ref } from 'lit-html/directives/ref.js'

// === exports =======================================================

export { createRef, html, ref, withLit, Ref }

// === functions =====================================================

function withLit(init: Function): any {
  return {
    patch: render,
    init
  }
}
