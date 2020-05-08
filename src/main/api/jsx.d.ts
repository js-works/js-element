import VirtualElement from './api/#types/VElement'

declare global {
  module JSX {
    type Element = VirtualElement 

    interface IntrinsicElements {
      [key: string]: any
    }
  }
}