// Minimal browser stand-in for node:async_hooks. deepagents imports AsyncLocalStorage
// for optional context propagation; in the browser we just run callbacks directly.
export class AsyncLocalStorage {
  #store;
  getStore() {
    return this.#store;
  }
  run(store, fn, ...args) {
    const prev = this.#store;
    this.#store = store;
    try {
      return fn(...args);
    } finally {
      this.#store = prev;
    }
  }
  enterWith(store) {
    this.#store = store;
  }
  disable() {
    this.#store = undefined;
  }
}
const asyncHooks = { AsyncLocalStorage };
export default asyncHooks;
