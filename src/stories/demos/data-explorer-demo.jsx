import { Spec } from 'js-spec'

import { html, component, prop, useInterval } from '../../main/index'
import addStyleSheet  from './tools/addStyleSheet'

import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

component('jsc-data-explorer', {
  props: {
  },

  validate: getDataExplorerPropsValidator(),

  main(c) {
    useInterval(c, () => {
      c.update()
    }, 1000)

    return () => {
      const data = []

      for (let i = 0; i < 5; ++i) {
        data[i] = []

        for (let j = 0; j < 7; ++j) {
          data[i][j] = [Math.random()]
        }
      }

      return html`<button class="btn btn-link">Juhu</button>
        <table width="100%" class="table">
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
                const cells = row.map(field => html`<td>${field}</td>`)

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

component('data-explorer-demo', {
  render() {
    const
      columns = [
        {
          type: 'column',
          title: 'First name',
          field: 'firstName',
          align: 'center',
          sortable: false,
          width: 100
        }
      ]

    return html`
      <div>
        <h3>Data explorer demo</h3>
        <jsc-data-explorer
          .columns=${columns}
        />
      </div>
    `
  }
})

function renderTable() {

}


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
    <div class="jsc-data-explorer__pagination-bar">
        <div class="jsc-data-explorer__pagination-bar-start">
          ${btnFirst}
          ${btnPrevious}
          ${pageNumInput}
          ${btnNext}
          ${btnLast}
        </div>

        <div class="jsc-data-explorer__pagination-bar-center">
           ${pageSizeSelector}
        </div>
        
        <div class="jsc-data-explorer__pagination-bar-end">
          ${paginationInfo}
        </div>
    </div>
    `
}


function renderFirstPageButton() {
  return html` 
    <button class="jsc-data-explorer__pagination-bar-button">
      <clr-icon shape="step-forward-2" style="transform: rotate(180deg);"/>
    </button>
  `
}

function renderPreviousPageButton() {
  return html` 
    <button class="jsc-data-explorer__pagination-bar-button">
      <clr-icon shape="caret" style="transform: rotate(-90deg)"/>
    </button>
  `
}

function renderNextPageButton() {
  return html` 
    <button class="jsc-data-explorer__pagination-bar-button">
      <clr-icon shape="caret" style="transform: rotate(90deg)"/>
    </button>
  `
}

function renderLastPageButton() {
  return html` 
    <button class="jsc-data-explorer__pagination-bar-button">
      <clr-icon shape="step-forward-2"/>
    </button>
  `
}

function renderPageNumInput() {
  return html`
    Page <input class="jsc-data-explorer__pagination-bar-input"/> of 123
  `
}

function renderPaginationInfo() {
  return html`
    Items 300 - 350 of 587
  `
}

function renderPageSizeSelector() {
  return html`
    <div>
      <label>Page size:</label>
      <select class="select">
        <option>10</option>
        <option>20</option>
        <option>50</option>
        <option>100</option>
        <option>250</option>
        <option>500</option>
      </select>
    </div>
  `
}

// --- prop validation ----------------------------------------------

function getDataExplorerPropsValidator() {
  return Spec.checkProps({
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
}

// --- styles -------------------------------------------------------

addStyleSheet(`
  .jsc-data-explorer {
  }

  .jsc-data-explorer__paginationbar {
    display: table-row
  }

  .jsc-data-explorer__pagination-bar-start {
    display: table-cell;
    white-space: nowrap;
  }

  .jsc-data-explorer__pagination-bar-center {
    display: table-cell;
    margin: 10px;
    width: 100%;
    white-space: nowrap;
  }

  .jsc-data-explorer__pagination-bar-end {
    display: table-cell;
    white-space: nowrap;
  }

  .jsc-data-explorer__pagination-bar-button {
    background: none;
    border: none;
  }
  
  .jsc-data-explorer__pagination-bar-input {
    width: 3rem;
  }
`)