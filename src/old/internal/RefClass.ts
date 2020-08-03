export default class RefClass<T> {
  current: T
  
  constructor(initialValue: T) {
    this.current = initialValue
  }
}
