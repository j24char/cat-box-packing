// In-memory mock of @react-native-async-storage/async-storage for tests.
const store = new Map();

module.exports = {
  setItem: async (key, value) => {
    store.set(key, String(value));
  },
  getItem: async (key) => (store.has(key) ? store.get(key) : null),
  removeItem: async (key) => {
    store.delete(key);
  },
  clear: async () => {
    store.clear();
  },
  _store: store,
};