import fs from "fs/promises";
import Knex from "knex";

import BasePlugin from "../base.js";

export default class DatabasePlugin extends BasePlugin {
  static configSchema = {
    databasePath: {
      doc: "Path to the sqlite database",
      env: "DATABASE_PATH",
      format: String,
      default: "data.sqlite3",
    },
    databaseMigrationsPath: {
      doc: "Path to the directory containing Knex database migrations",
      env: "DATABASE_MIGRATIONS_PATH",
      format: String,
      default: "./lib/database/migrations",
    },
    databaseSeedsPath: {
      doc: "Path to the directory containing Knex database seeds",
      env: "DATABASE_SEEDS_PATH",
      format: String,
      default: "./lib/database/seeds",
    },
  };

  constructor(parent) {
    super(parent);

    const { program } = this.parent.cli;

    program
      .command("init")
      .description("initialize the database")
      .action(this.runInit.bind(this));

    program
      .command("import <filename>")
      .description("import data from an outbox JSON export")
      .action(this.runImport.bind(this));

    const databaseProgram = program
      .command("db")
      .description("database operations");

    const migrateProgram = databaseProgram
      .command("migrate")
      .description("database migration operations");

    migrateProgram
      .command("make <name>")
      .description("create a new migration")
      .action((name) => this.runMigratorCommand("down", name));

    migrateProgram
      .command("latest")
      .description("run all migrations")
      .action(() => this.runMigratorCommand("latest"));

    migrateProgram
      .command("up")
      .description("run the next migration")
      .action(() => this.runMigratorCommand("up"));

    migrateProgram
      .command("down")
      .description("undo the last migration")
      .action(() => this.runMigratorCommand("down"));

    migrateProgram
      .command("currentVersion")
      .description("show the latest migration version")
      .action(() => this.runMigratorCommand("currentVersion"));

    migrateProgram
      .command("list")
      .description("list applied migrations")
      .action(() => this.runMigratorCommand("list"));

    migrateProgram
      .command("unlock")
      .description("unlock migrations")
      .action(() => this.runMigratorCommand("unlock"));

    const seedProgram = databaseProgram
      .command("seed")
      .description("database seed operations");

    seedProgram
      .command("make <name>")
      .description("make a new seed file")
      .action((name) => this.runSeederCommand("make", name));

    seedProgram
      .command("run")
      .description("run all seed files")
      .action((name) => this.runSeederCommand("run", name));
  }

  async preAction() {
    const { config } = this.parent;

    this.migratorConfig = {
      directory: config.get("databaseMigrationsPath"),
      extension: "cjs",
    };

    this.seederConfig = {
      directory: config.get("databaseSeedsPath"),
      extension: "cjs",
    };

    this.connection = Knex({
      client: "sqlite3",
      useNullAsDefault: true,
      connection: {
        filename: config.get("databasePath"),
      },
    });
  }

  async postAction() {
    this.connection.destroy();
  }

  async runMigratorCommand(name, ...args) {
    const result = await this.connection.migrate[name](
      ...args,
      this.migratorConfig
    );
    this.log.info({ msg: name, result });
  }

  async runSeederCommand(name, ...args) {
    const result = await this.connection.seed[name](...args, this.seederConfig);
    this.log.info({ msg: name, result });
  }

  async runInit() {
    await this.connection.migrate.latest(this.migratorConfig);
    await this.connection.seed.run(this.seederConfig);
  }

  async runImport(outboxFilename) {
    const { log } = this;

    const outboxData = await fs.readFile(outboxFilename);
    const outbox = JSON.parse(outboxData);

    const activities = outbox.orderedItems;
    if (!Array.isArray(activities)) {
      log.error({ msg: "No items found in outbox" });
    }

    this.log.debug({
      msg: "Found activities in outbox",
      count: outbox.orderedItems.length,
    });

    const tableActivities = this.connection("activities");
    for (const activity of activities) {
      const { id, url, type, published, content } = activity;
      await tableActivities
        .insert({
          id,
          url,
          type,
          published,
          content,
          json: JSON.stringify(activity),
        })
        .onConflict("id")
        .merge();
    }
  }
}
