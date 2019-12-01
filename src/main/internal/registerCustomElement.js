export default function registerCustomElement(name, constructor) {
  customElements.define(name, constructor)
}