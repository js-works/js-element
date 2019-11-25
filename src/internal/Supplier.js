export default class Supplier {
  constructor(getter) {
    this.get = getter
    this.map = mapper => mapper(getter())
  }
}