export class BoundedMemo<K, V extends NonNullable<unknown>> {
  private readonly values = new Map<K, V>();

  constructor(
    private readonly capacity: number,
    private readonly compute: (key: K) => V,
  ) {}

  get(key: K): V {
    const remembered = this.values.get(key);
    if (remembered !== undefined) {
      return remembered;
    }

    const computed = this.compute(key);
    this.remember(key, computed);
    return computed;
  }

  private remember(key: K, value: V): void {
    if (this.values.size >= this.capacity) {
      this.forgetEarliest();
    }
    this.values.set(key, value);
  }

  private forgetEarliest(): void {
    const earliest = this.values.keys().next();
    if (!earliest.done) {
      this.values.delete(earliest.value);
    }
  }
}
