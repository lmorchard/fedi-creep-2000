import BasePlugin from "./base.js";
import pino from "pino";

export default class LoggingPlugin extends BasePlugin {
  static configSchema = {
    logLevel: {
      doc: "Logging level",
      env: "LOG_LEVEL",
      format: ["trace", "debug", "info", "warn", "error"],
      default: "info",
    },
  };

  /** @param {import("./app.js").default} parent */
  constructor(parent) {
    super(parent);

    this.transport = {};

    const { program } = this.parent.cli;
    program.option(
      "--no-pretty-logs",
      "disable pretty printing of logs in a TTY"
    );
    program.hook("preAction", this.preAction.bind(this));    
  }

  async preAction(command) {
    const { config } = this.parent.config;
    const { prettyLogs } = command.opts();

    if (process.stdout.isTTY && prettyLogs) {
      this.transport = {
        target: "pino-pretty",
        options: { colorize: true },
      };
    }

    this.rootlog = pino({
      level: config.get("logLevel"),
      transport: this.transport,
    });
  }

  log(bindings = {}, options) {
    return this.rootlog.child(bindings, options);
  }
}
