import { Spec } from 'js-spec'
import { html, component, props } from '../../../main/index'

import dataExplorerStyles from './data-explorer-styles'

component('jsc-data-explorer', {
  props: {
  },

  validate: process.env.NODE_ENV === 'development'
    ? Spec.lazy(() => validateDataExplorerProps)
    : null,

  styles: dataExplorerStyles,
  main() {
    /*
    useInterval(c, () => {
      c.update()
    }, 1000)
    */
    return () => {
      const data = []

      for (let i = 0; i < 2; ++i) {
        data[i] = []

        for (let j = 0; j < 7; ++j) {
          data[i][j] = [Math.random()]
        }
      }

      return html`
        <table width="100%" class="table jsc-data-explorer__table">
          <thead>
            <tr>
                <th>User ID</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Street</th>
                <th>City</th>
                <th>Zip</th>
                <th>Country</th>
            </tr>
          </thead>
          <tbody>
            ${
            data.map(row => {
                const cells = row.map(field =>
                  html`<td class="jsc-data-explorer__table-cell">${field}</td>`)

                return html`<tr>${cells}</tr>`
            })
          }

          </tbody>
        </table>
        ${renderPaginationBar()}
      `
    }
  }
})

function renderPaginationBar() {
  const
    btnFirst = renderFirstPageButton(),
    btnPrevious = renderPreviousPageButton(),
    btnNext = renderNextPageButton(),
    btnLast = renderLastPageButton(),
    pageNumInput = renderPageNumInput(),
    pageSizeSelector = renderPageSizeSelector(),
    paginationInfo = renderPaginationInfo()

  return html`
    <div class="jsc-data-explorer__footer">
        <div class="jsc-data-explorer__footer-start">
          ${pageSizeSelector}
        </div>

        <div class="jsc-data-explorer__footer-center">
          ${paginationInfo}
        </div>
        
        <div class="jsc-data-explorer__footer-end">
          ${btnFirst}
          ${btnPrevious}
          ${pageNumInput}
          ${btnNext}
          ${btnLast}
        </div>
    </div>
    `
}

function renderFirstPageButton() {
  return html` 
    <button class="jsc-data-explorer__footer-button">
      <clr-icon shape="step-forward-2" style="transform: rotate(180deg);"></clr-icon>
    </button>
  `
}

function renderPreviousPageButton() {
  return html` 
    <button class="jsc-data-explorer__footer-button">
      <clr-icon shape="caret" style="transform: rotate(-90deg)"></crl-icon>
    </button>
  `
}

function renderNextPageButton() {
  return html` 
    <button class="jsc-data-explorer__footer-button">
      <clr-icon shape="caret" style="transform: rotate(90deg)"></clr-icon>
    </button>
  `
}

function renderLastPageButton() {
  return html` 
    <button class="jsc-data-explorer__footer-button">
      <clr-icon shape="step-forward-2"></crl-icon>
    </button>
  `
}

function renderPageNumInput() {
  return html`
    <input class="jsc-data-explorer__footer-input"> / 123
  `
}

function renderPaginationInfo() {
  return html`
    <div class="jsc-data-explorer__footer-info">300 - 350 of 587 items</div>
  `
}

function renderPageSizeSelector() {
  return html`
    <div>
      <div class="clr-select-wrapper">
        <label class="jsc-data-explorer__footer-page-size-label">Items per page</label>
        <select>
            <option>10</option>
            <option>20</option>
            <option>50</option>
            <option>100</option>
            <option>250</option>
            <option>500</option>
        </select>
      </div>
    </div>
  `
}

// --- prop validation ----------------------------------------------

const validateDataExplorerProps = Spec.checkProps({
  required: {

/*
    actions:
      Spec.arrayOf(
        Spec.and(
          Spec.exact({
            type: Spec.oneOf('default', 'singleRow', 'multiRow'),
            text: Spec.string,
            //icon: Spec.optional(isNode)
          }))),
*/
    columns:
      Spec.arrayOf(
        Spec.exact({
          type: Spec.is('column'),
          title: Spec.string,
          field: Spec.optional(Spec.string),
          align: Spec.optional(Spec.oneOf('start', 'center', 'end')),
          sortable: Spec.optional(Spec.boolean),
          width: Spec.optional(Spec.integer)
        })),

//      loadData: Spec.function
  }
})
