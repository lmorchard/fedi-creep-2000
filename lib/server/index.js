import path from "path";
import { URL } from "url";

import Fastify from "fastify";
import FastifyStatic from "@fastify/static";
import FastifyAccepts from "@fastify/accepts";
import Boom from "@hapi/boom";

import BasePlugin from "../base.js";

export default class ServerPlugin extends BasePlugin {
  static configSchema = {
    host: {
      doc: "Server host",
      env: "HOST",
      format: String,
      default: "localhost",
    },
    port: {
      doc: "Server port",
      env: "PORT",
      format: Number,
      default: 8089,
    },
    publicPath: {
      doc: "Public web static resources path",
      env: "PUBLIC_PATH",
      format: String,
      default: "public",
    },
  };

  /** @param {import("../app.js").default} parent */
  constructor(parent) {
    super(parent);
    const { program } = this.parent.cli;
    program
      .command("serve")
      .description("run the web server")
      .action(this.runServer.bind(this));
  }

  async init() {}

  async runServer() {
    const { config } = this.parent;
    this.server = await this.buildServer();
    this.server.listen({
      host: config.get("host"),
      port: config.get("port"),
    });
  }

  async buildServer() {
    const { config } = this.parent;
    
    const server = Fastify({
      logger: {
        level: config.get("logLevel"),
        transport: this.parent.logging.transport,
      },
    });

    server
      .register(FastifyStatic, {
        root: path.resolve(config.get("publicPath")),
        prefix: "/",
      })
      .register(FastifyAccepts);

    /*
      server
        .get("/.well-known/webfinger", getWebFinger)
        .get("/actors/:username/icon", getActorIcon)
        .get("/actors/:username", getActor)
        .post("/inbox", postSharedInbox)
        .post("/actors/:username/inbox", postActorInbox);
    */

    return server;
  }
}
