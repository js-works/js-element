namespace JSX {
  interface IntrinsicElements {
    [tag: string]: any
  }

  interface IntrinsicAttributes {
    [key: string]: any
  }

  interface DOMAttributes extends IntrinsicAttributes {
    [key: string]: any
  }

  interface HTMLAttributes extends DOMAttributes {
    [key: string]: any
  }
  interface ElementChildrenAttribute {
    children: {}
  }
}

declare global {
  module 'react' {
    interface Attributes {
      css?: CSSProp
    }

    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      [key: string]: any
    }
  }
}
