import Props from './Props'
import Methods from './Methods'

type Ctrl<P extends Props = {}, M extends Methods = {}> = {
  getName(): string,
  getProps(): P,
  getRoot(): Element, // TODO!!!
  isInitialized(): boolean,
  isMounted(): boolean,
  update(runOnceBeforeUpdate?: () => void): void,
  afterMount(action: () => void): void,
  beforeUpdate(action: () => void): void,
  afterUpdate(action: () => void): void,
  beforeUnmount(action: () => void): void,
  setMethods(methods: M): void
}

export default Ctrl
