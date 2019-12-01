// external imports
import { Spec } from 'js-spec'

// internal imports
import { html, component, prop } from '../../../main/index'
import addStyles from '../tools/addStyles'

// === jsc-login-form ===============================================

component('jsc-login-form', {
  props: {
    fields: prop.arr.opt(),
    rememberLogin: prop.bool.opt(),
    fullSize: prop.bool.opt(),
    onLogin: prop.func.opt(),

    // slots: header, footer, aside
  },

  validate: process.env.NODE_ENV === 'developement'
    ? Spec.lazy(() => validateLoginFormProps)
    : null,

  shadow: 'open',

  main(c, props) {
    const fieldConfigs = props.fields
      ? props.fields
      : [
        { type: 'text', name: 'username', label: 'Username' },
        { type: 'password', name: 'password', label: 'Password' }
      ] 

    const fieldElems = fieldConfigs.map(fieldConfig => {
      const
        type = fieldConfig.type,
        label = html`<label>${fieldConfig.label}</label>`, 

        fieldElem = type === 'password'
          ? renderPasswordField(fieldConfig)
          : type === 'selection'
            ? renderSelectField(fieldConfig)
            : renderTextField(fieldConfig)

      return html`
        <div class="jsc-login-form__field-wrapper">
          ${label} ${fieldElem}
        </div>`
    })

    return () => html`
      <div class="jsc-login-form clr-form-controller">
        <slot name="header">
          <section class="jsc-login-form__default-header">Login user</section>
        </slot>
        <div class="jsc-login-form__fields-container clr-control-container clr-control-inline">
          ${fieldElems}
        </div>
        ${props.rememberLogin ? renderRememberLoginCheckbox() : null}
        ${renderLoginButton()}
      </div>
    `
  }
})

// === validation ===================================================

const validateLoginFormProps = Spec.checkProps({
  optional: {
    performLogin:
      Spec.nullable(Spec.function),
    
    rememberLogin:
      Spec.boolean,

    fullSize:
      Spec.boolean,

    fields:
      Spec.arrayOf(
        Spec.and(
          Spec.prop('type', Spec.oneOf('text', 'password', 'choice')),

          Spec.or(
            {
              when: Spec.prop('type', Spec.is('text')),

              then:
                Spec.exact({
                  type: Spec.is('text'),
                  name: Spec.string,
                  label: Spec.string,
                  defaultValue: Spec.optional(Spec.string)
                })
            },
            {
              when: Spec.prop('type', Spec.is('password')),

              then:
                Spec.exact({
                  type: Spec.is('password'),
                  name: Spec.string,
                  label: Spec.string,
                  defaultValue: Spec.optional(Spec.string)
                })
            },
            {
              when: Spec.prop('type', Spec.is('choice')),

              then:
                Spec.exact({
                  type: Spec.is('selection'),
                  name: Spec.string,
                  label: Spec.string,
                  defaultValue: Spec.string,

                  options: Spec.arrayOf(
                    Spec.exact({
                      value: Spec.string,
                      text: Spec.string
                    })
                  )
                })
            })
        ))
  }
})

// === styles =======================================================

addStyles('jsc-login-form', `
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
`)

// === misc =========================================================

function renderTextField(config) {
  return html`
    <input class="jsc-login-form__text-field clr-input">
  ` 
}

function renderPasswordField(config) {
  return html`
    <input type="password" class="jsc-login-form__password-field">
  ` 
}

function renderSelectField(config) {
  return html`
    <select class="jsc-login-form__select-field"></select>
  ` 
}

function renderRememberLoginCheckbox() {
  return html`
    <div class="clr-checkbox-wrapper">
      <label>Remeber login</label><input type="checkbox"
        class="clr-checkbox jsc-login-form__remember-login-checkbox"
      >
    </div> <div class="clr-checkbox-wrapper">
      <input type="checkbox" id="vertical-checkbox2" name="checkbox-full" value="option2" class="clr-checkbox">
      <label for="vertical-checkbox2" class="clr-control-label">option 2</label>
    </div>
  `
}

function renderLoginButton(config) {
  return html`
    <button class="jsc-login-form__login-button">
      Log in
    </button>
   `
}
