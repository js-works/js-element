import { css } from '../../../main/index'

export default css`
  .jsc-login-form {
    width: 400px;
  }

  .jsc-login-form__default-header {
    font-weight: 200;
    color: #000;
    font-family: Metropolis,"Avenir Next","Helvetica Neue",Arial,sans-serif;
    letter-spacing: normal;
  }

  .jsc-login-form__fields-container {
    padding: 0 0.5rem;
    width: 100%;
    margin-bottom: 1em;
  }

  .jsc-login-form__field-wrapper {
    width: 100%;
    display: table-row
  }
  
  .jsc-login-form__field-wrapper > label {
    padding-right: .8rem;
    white-space: nowrap;
    width: 0%;
  }

  .jsc-login-form__field-wrapper > * {
    display: table-cell
  }

  .jsc-login-form__login-button {
    display: block;
    padding: var(--clr-btn-appearance-form-padding,0 .6rem);
    margin-top: .5em;
    width: 100%;
    color: white;
    border: none;
    height: var(--clr-btn-appearance-form-height,1.8rem);
    color: var(--clr-btn-primary-color,#fff);
    background-color: var(--clr-btn-primary-bg-color,#0088c2);
    font-size: var(--clr-btn-appearance-form-font-size,.6rem);
    text-transform: uppercase;
    margin-top: var(--clr-btn-vertical-margin,.3rem);
    margin-bottom: var(--clr-btn-vertical-margin,.3rem);
    margin-right: var(--clr-btn-horizontal-margin,.6rem);
    border-radius: var(--clr-btn-border-radius,.15rem);
    cursor: pointer;
  }

  .jsc-login-form__text-field,
  .jsc-login-form__password-field,
  .jsc-login-form__select-field {
    width: 100%
  }
`
