/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema
    .raw(CREATE_TABLE_ACTIVITIES)
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
    .dropTable("activities")
    .dropTable("activitiesSearch");
};

const CREATE_TABLE_ACTIVITIES = `--sql
  CREATE TABLE activities (
    json TEXT,
    id VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.id")) STORED UNIQUE,
    published VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.published")) STORED,
    type VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.type")) STORED,
    actor VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.actor")) STORED,
    objectPublished VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.published")) STORED,
    objectType VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.type")) STORED,
    objectUrl VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.url")) STORED,
    objectContent VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.content")) STORED,
    objectAttributedTo VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.attributedTo")) STORED,
    objectInReplyTo VARCHAR(255) GENERATED ALWAYS AS (json_extract(json, "$.object.inReplyTo")) STORED
  )
`;

const CREATE_TABLE_ACTIVITIES_SEARCH = `
  CREATE VIRTUAL TABLE activitiesSearch
  USING fts5(
    id UNINDEXED,
    objectContent
  );
`;

const CREATE_TRIGGER_ACTIVITIES_INSERT = `
  CREATE TRIGGER activities_insert AFTER INSERT ON activities BEGIN
    INSERT INTO
      activitiesSearch (id, objectContent)
    VALUES (
      new.id,
      new.objectContent
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
      objectContent = new.objectContent
    WHERE id = new.id;
  END;
`;
