export default class BasePlugin {
  static configSchema = {};

  /** @param {import("./app.js").default} parent */
  constructor(parent) {
    this.parent = parent;

    const { config } = parent;
    if (config) config.extendSchema(this.constructor.configSchema);
  }

  async init() {}

  get log() {
    if (!this._log) {
      this._log = this.parent.logging.log({
        module: this.constructor.name,
      });
    }
    return this._log;
  }
}
