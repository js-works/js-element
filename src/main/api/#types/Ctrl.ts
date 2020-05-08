import Props from './Props'

type Ctrl<P extends Props = {}> = {
  getName(): string,
  getProps(): P,
  getRoot(): any, // TODO!!!
  isInitialized(): boolean,
  isMounted(): boolean,
  update(runOnceBeforeUpdate?: () => void): void,
  afterMount(action: () => void): void,
  beforeUpdate(action: () => void): void,
  afterUpdate(action: () => void): void,
  beforeUnmount(action: () => void): void,
  setMethods(methods: any): void // TODO!!!!!!!!!!!!!!!
}

export default Ctrl
