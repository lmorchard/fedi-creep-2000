/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema
    .createTable("actors", function (table) {
      table.text("json");
      table.string("id", 255).unique();
      table.string("url", 255);
      table.string("type", 255);
      table.string("name", 255);
      table.string("summary", 255);
    })
    .createTable("activities", function (table) {
      table.text("json");
      table.string("id", 255).unique();
      table.string("url", 255);
      table.string("type", 255);
      table.string("published", 255);
      table.text("content");
    })
    .raw(CREATE_TABLE_ACTIVITIES_SEARCH)
    .raw(CREATE_TRIGGER_ACTIVITIES_INSERT)
    .raw(CREATE_TRIGGER_ACTIVITIES_DELETE)
    .raw(CREATE_TRIGGER_ACTIVITIES_UPDATE);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTable("actors")
    .dropTable("activities")
    .dropTable("activitiesSearch");
};

const CREATE_TABLE_ACTIVITIES_SEARCH = `
  CREATE VIRTUAL TABLE activitiesSearch
  USING fts5(
    id UNINDEXED,
    actor,
    type,
    published,
    objectContent
  );
`;

const CREATE_TRIGGER_ACTIVITIES_INSERT = `
  CREATE TRIGGER activities_insert AFTER INSERT ON activities BEGIN
    INSERT INTO
      activitiesSearch (id, type, published, actor, objectContent)
    VALUES (
      new.id,
      new.type,
      new.published,
      json_extract(new.json, "$.actor"),
      json_extract(new.json, "$.object.content")
    );
  END;
`;

const CREATE_TRIGGER_ACTIVITIES_DELETE = `
  CREATE TRIGGER activities_delete AFTER DELETE ON activities BEGIN
    DELETE FROM activitiesSearch WHERE id = old.id;
  END;
`;

const CREATE_TRIGGER_ACTIVITIES_UPDATE = `
  CREATE TRIGGER activities_update AFTER UPDATE ON activities BEGIN
    UPDATE activitiesSearch
    SET 
      type = new.type,
      published = new.published,
      actor = json_extract(new.json, "$.actor"),
      objectContent = json_extract(new.json, "$.object.content")
    WHERE id = new.id;
  END;
`;
