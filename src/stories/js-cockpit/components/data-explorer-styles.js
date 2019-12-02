import { css } from '../../../main/index'

export default css`
  .jsc-data-explorer {
  }

  .jsc-data-explorer__table {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .jsc-data-explorer__table > thead > tr > th {
    font-size: .55rem !important;
  }

  .jsc-data-explorer__table > tbody > tr > td {
    font-size: .65rem !important;
   }

  .jsc-data-explorer__footer {
    font-size: .55rem;
    white-space: nowrap;
    padding: 4px 8px;
    text-align: right;
    background-color: var(--clr-thead-bgcolor,#fafafa);
    border: var(--clr-global-borderwidth,.05rem) solid var(--clr-table-footer-border-top-color,#ccc);
    border-bottom-left-radius: var(--clr-global-borderradius,.15rem);
    border-bottom-right-radius: var(--clr-global-borderradius,.15rem);
  }

  .jsc-data-explorer__footer > * {
    display: inline-block;
  }

  .jsc-data-explorer__footer-page-size-label {
    margin-right: 10px;
  }

  .jsc-data-explorer__footer-info {
    margin: 0 30px 0 20px;
  }

  .jsc-data-explorer__footer-button {
    background: none;
    border: none;
    width: .8rem;
    height: 1.2rem;
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: var(--clr-datagrid-pagination-btn-color,#666);
  }

  .jsc-data-explorer__footer-input {
    height: 1rem;
    margin: 0 3px 0 5px;
    width: 2rem;
    background: #fff;
    background-color: var(--clr-forms-textarea-background-color,#fff);
    border-color: var(--clr-datagrid-pagination-input-border-color,#ccc);
    border-width: var(--clr-global-borderwidth,.05rem);
    border-radius: var(--clr-global-borderradius,.15rem);
    line-height: 1.2rem;
    font-size: .55rem;
    min-width: 1.2rem;
    text-align: center;
    transition: none!important;
    border: .05rem solid #ccc;
    border-color: rgb(204, 204, 204);
  }
  
  .jsc-data-explorer__footer-input:focus {
    outline: none;
    border: var(--clr-global-borderwidth,.05rem) solid var(--clr-forms-focused-color,#179bd3); // TODO
  }
`
