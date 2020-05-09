declare global {
  module JSX {
    type Element = any // TODO 

    interface IntrinsicElements {
      [key: string]: any // TODO
    }
  }
}
