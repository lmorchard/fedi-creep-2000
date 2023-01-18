import * as dotenv from "dotenv";
import Convict from "convict";
import BasePlugin from "./base.js";

export default class ConfigPlugin extends BasePlugin {
  constructor(parent) {
    super(parent);

    this.configSchema = {};

    const { program } = this.parent.cli;

    program.option("-F, --config <name=value...>", "set configuration values");

    const configProgram = program
      .command("config")
      .description("configuration operations");

    configProgram
      .command("show")
      .description("show current configuration")
      .action(this.runConfigShow.bind(this));
  }

  extendSchema(schema = {}) {
    this.configSchema = {
      ...this.configSchema,
      ...schema,
    };
  }

  get(name) {
    return this.config.get(name);
  }

  set(name, value) {
    return this.config.set(name, value);
  }

  async preAction(command) {
    const { configSchema } = this;

    dotenv.config();
    this.config = Convict(configSchema);

    // Set config values from command line options
    // TODO: See if we can't reuse convict's built-in method for this?
    const opts = command.opts();
    if (opts.config) {
      for (const pair of opts.config) {
        const [name, value] = pair.split("=");
        if (name in configSchema && typeof value !== "undefined") {
          this.config.set(name, value);
        }
      }
    }
  }

  async runConfigShow() {
    const { parent, configSchema, config } = this;
    const log = this.log;

    const schema = configSchema;
    const props = config.getProperties();

    for (const [name, defn] of Object.entries(schema)) {
      const { doc, env, default: defaultValue } = defn;
      const currentValue = props[name];
      log.info({ configName: name, env, doc, defaultValue, currentValue });
    }
  }
}
