export default class Supplier {
  constructor(getter) {
    this.get = getter
    this.map = mapper => mapper(getter())
  }

  get() {
    // will be overridden in constructor
  }

  map(map) { 
    // will be overridden in constructor
  }
}