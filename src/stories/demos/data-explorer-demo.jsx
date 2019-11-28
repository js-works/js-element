import { Spec } from 'js-spec'

import { html, component, prop, useInterval } from '../../main/index'
import addStyleSheet  from './tools/addStyleSheet'

import '@clr/ui/clr-ui.min.css'
import '@clr/icons/clr-icons.min.css'
import '@clr/icons/clr-icons.min.js'

import '@polymer/iron-dropdown/iron-dropdown.js'

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

      for (let i = 0; i < 2; ++i) {
        data[i] = []

        for (let j = 0; j < 7; ++j) {
          data[i][j] = [Math.random()]
        }
      }

      return html`<button class="btn btn-link">Juhu</button>
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
          ${pageSizeSelector}
        </div>

        <div class="jsc-data-explorer__pagination-bar-center">
          ${paginationInfo}
        </div>
        
        <div class="jsc-data-explorer__pagination-bar-end">
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
    <input class="jsc-data-explorer__pagination-bar-input"/> / 123
  `
}

function renderPaginationInfo() {
  return html`
    <div class="jsc-data-explorer__pagination-bar-info">300 - 350 of 587 items</div>
  `
}

function renderPageSizeSelector() {
  return html`

  <iron-dropdown id="dropdown" horizontal-align="right" vertical-align="top">
        <div slot="dropdown-content">Hello!</div>
      </iron-dropdown>
    <div>
      <div class="clr-select-wrapper">
        <label>Items per page:</label>
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

  .jsc-data-explorer__table > thead > tr > th {
    font-size: .55rem !important;
  }

  .jsc-data-explorer__table > tbody > tr > td {
    font-size: .65rem !important;
   }

  .jsc-data-explorer__pagination-bar {
    font-size: .55rem;
    white-space: nowrap;
    padding: 3px;
    text-align: right;
  }

  .jsc-data-explorer__pagination-bar > * {
    display: inline-block;
  }

  .jsc-data-explorer__pagination-bar-info {
    margin: 0 30px 0 20px;
  }

  .jsc-data-explorer__pagination-bar-button {
    background: none;
    border: none;
    width: .8rem;
    height: 1.2rem;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: var(--clr-datagrid-pagination-btn-color,#666);
  }

  .jsc-data-explorer__pagination-bar-input {
    height: 1rem;
    margin: 0 3px 0 5px;
    width: 2rem;
    background: #fff;
    background-color: var(--clr-forms-textarea-background-color,#fff);
    border-color: var(--clr-datagrid-pagination-input-border-color,#ccc);
    border-width: var(--clr-global-borderwidth,.05rem);
    border-radius: .15rem;
    border-radius: var(--clr-global-borderradius,.15rem);
    line-height: 1.2rem;
    font-size: .55rem;
    min-width: 1.2rem;
    text-align: center;
    transition: none!important;
    border: .05rem solid #ccc;
    border-radius: 3px;
    border-color: rgb(204, 204, 204);
  }
  
  .jsc-data-explorer__pagination-bar-input:focus {
    outline: none;
    border: var(--clr-global-borderwidth,.05rem) solid var(--clr-forms-focused-color, #179bd3); // TODO
  }
`)