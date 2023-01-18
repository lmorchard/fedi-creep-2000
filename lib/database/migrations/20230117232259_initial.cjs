/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("activities", function (table) {
      table.text("json");
      table.string("id", 255).unique();
      table.string("url", 255);
      table.string("type", 255);
      table.string("published", 255);
      table.text("content");
    })
    .createTable("actors", function (table) {
      table.text("json");
      table.string("id", 255).unique();
      table.string("url", 255);
      table.string("type", 255);
      table.string("name", 255);
      table.string("summary", 255);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("activities").dropTable("actors");
};
