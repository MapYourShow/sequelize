"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var query_generator_exports = {};
__export(query_generator_exports, {
  IBMiQueryGenerator: () => IBMiQueryGenerator
});
module.exports = __toCommonJS(query_generator_exports);
var import_utils = require("../../utils");
const Utils = require("../../utils");
const util = require("util");
const _ = require("lodash");
const { AbstractQueryGenerator } = require("../abstract/query-generator");
const DataTypes = require("../../data-types");
const { Model } = require("../../model");
const SqlString = require("../../sql-string");
const typeWithoutDefault = /* @__PURE__ */ new Set(["BLOB"]);
class IBMiQueryGenerator extends AbstractQueryGenerator {
  versionQuery() {
    return "SELECT CONCAT(OS_VERSION, CONCAT('.', OS_RELEASE)) AS VERSION FROM SYSIBMADM.ENV_SYS_INFO";
  }
  createSchema(schema) {
    return `CREATE SCHEMA "${schema}"`;
  }
  dropSchema(schema) {
    return `BEGIN IF EXISTS (SELECT * FROM SYSIBM.SQLSCHEMAS WHERE TABLE_SCHEM = ${schema ? `'${schema}'` : "CURRENT SCHEMA"}) THEN SET TRANSACTION ISOLATION LEVEL NO COMMIT; DROP SCHEMA "${schema ? `${schema}` : "CURRENT SCHEMA"}"; COMMIT; END IF; END`;
  }
  showSchemasQuery(options) {
    let skippedSchemas = "";
    if (options.skip) {
      for (let i = 0; i < options.skip.length; i++) {
        skippedSchemas += ` AND SCHEMA_NAME != '${options.skip[i]}'`;
      }
    }
    return `SELECT DISTINCT SCHEMA_NAME AS "schema_name" FROM QSYS2.SYSSCHEMAAUTH WHERE GRANTEE = CURRENT USER${skippedSchemas}`;
  }
  createTableQuery(tableName, attributes, options) {
    const primaryKeys = [];
    const foreignKeys = /* @__PURE__ */ Object.create(null);
    const attrStr = [];
    for (const attr in attributes) {
      if (!Object.prototype.hasOwnProperty.call(attributes, attr)) {
        continue;
      }
      const dataType = attributes[attr];
      if (dataType.includes("PRIMARY KEY")) {
        primaryKeys.push(attr);
        attrStr.push(`${this.quoteIdentifier(attr)} ${dataType.replace("PRIMARY KEY", "")}`);
      } else {
        attrStr.push(`${this.quoteIdentifier(attr)} ${dataType}`);
      }
    }
    let attributesClause = attrStr.join(", ");
    const pkString = primaryKeys.map((pk) => this.quoteIdentifier(pk)).join(", ");
    if (options.uniqueKeys) {
      const sortedPrimaryKeys = [...primaryKeys];
      sortedPrimaryKeys.sort();
      _.each(options.uniqueKeys, (columns, indexName) => {
        const sortedColumnFields = [...columns.fields];
        sortedColumnFields.sort();
        const uniqueIsPrimary = sortedColumnFields.length === primaryKeys.length && sortedColumnFields.every((value, index) => {
          return value === sortedPrimaryKeys[index];
        });
        if (uniqueIsPrimary) {
          return true;
        }
        if (columns.customIndex) {
          if (typeof indexName !== "string") {
            indexName = `uniq_${tableName}_${columns.fields.join("_")}`;
          }
          attributesClause += `, CONSTRAINT ${this.quoteIdentifier(indexName)} UNIQUE (${columns.fields.map((field) => this.quoteIdentifier(field)).join(", ")})`;
        }
      });
    }
    if (pkString.length > 0) {
      attributesClause += `, PRIMARY KEY (${pkString})`;
    }
    for (const fkey in foreignKeys) {
      if (Object.prototype.hasOwnProperty.call(foreignKeys, fkey)) {
        attributesClause += `, FOREIGN KEY (${this.quoteIdentifier(fkey)}) ${foreignKeys[fkey]}`;
      }
    }
    let tableObject;
    if (typeof tableName === "string") {
      tableObject = { table: tableName };
    } else {
      tableObject = tableName;
    }
    return `BEGIN
    DECLARE CONTINUE HANDLER FOR SQLSTATE VALUE '42710'
      BEGIN END;
      CREATE TABLE ${tableName.schema ? `"${tableObject.schema}".` : ""}"${tableObject.table ? tableObject.table : tableObject.tableName}" (${attributesClause});
      END`;
  }
  dropTableQuery(tableName, options) {
    let table = tableName;
    let schema;
    if (typeof table === "object") {
      schema = table.schema || void 0;
      table = table.table;
    } else if (options.schema) {
      schema = options.schema;
    }
    return `DROP TABLE IF EXISTS ${schema ? `"${schema}".` : ""}"${table}"`;
  }
  describeTableQuery(tableName, schema) {
    const sql = `SELECT
    QSYS2.SYSCOLUMNS.*,
    QSYS2.SYSCST.CONSTRAINT_NAME,
    QSYS2.SYSCST.CONSTRAINT_TYPE
    FROM
    QSYS2.SYSCOLUMNS
    LEFT OUTER JOIN
      QSYS2.SYSCSTCOL
    ON
      QSYS2.SYSCOLUMNS.TABLE_SCHEMA = QSYS2.SYSCSTCOL.TABLE_SCHEMA
      AND
      QSYS2.SYSCOLUMNS.TABLE_NAME = QSYS2.SYSCSTCOL.TABLE_NAME
      AND
      QSYS2.SYSCOLUMNS.COLUMN_NAME = QSYS2.SYSCSTCOL.COLUMN_NAME
    LEFT JOIN
      QSYS2.SYSCST
    ON
      QSYS2.SYSCSTCOL.CONSTRAINT_NAME = QSYS2.SYSCST.CONSTRAINT_NAME
    WHERE QSYS2.SYSCOLUMNS.TABLE_SCHEMA = ${schema ? `'${schema}'` : "CURRENT SCHEMA"} AND QSYS2.SYSCOLUMNS.TABLE_NAME = '${tableName}'`;
    return sql;
  }
  showTablesQuery(schema) {
    return `SELECT TABLE_NAME FROM SYSIBM.SQLTABLES WHERE TABLE_TYPE = 'TABLE' AND TABLE_SCHEM = ${schema ? `'${schema}'` : "CURRENT SCHEMA"}`;
  }
  addColumnQuery(table, key, dataType) {
    dataType.field = key;
    const definition = this.attributeToSQL(dataType, {
      context: "addColumn",
      tableName: table,
      foreignKey: key
    });
    return `ALTER TABLE ${this.quoteTable(table)} ADD ${this.quoteIdentifier(key)} ${definition}`;
  }
  removeColumnQuery(tableName, attributeName) {
    return `ALTER TABLE ${this.quoteTable(tableName)} DROP COLUMN ${this.quoteIdentifier(attributeName)}`;
  }
  changeColumnQuery(tableName, attributes) {
    const attrString = [];
    const constraintString = [];
    for (const attributeName in attributes) {
      let definition = attributes[attributeName];
      if (definition.includes("REFERENCES")) {
        const attrName = this.quoteIdentifier(attributeName);
        definition = definition.replace(/.+?(?=REFERENCES)/, "");
        const foreignKey = this.quoteIdentifier(`${attributeName}`);
        constraintString.push(`${foreignKey} FOREIGN KEY (${attrName}) ${definition}`);
      } else {
        attrString.push(`"${attributeName}" SET DATA TYPE ${definition}`);
      }
    }
    let finalQuery = "";
    if (attrString.length) {
      finalQuery += `ALTER COLUMN ${attrString.join(", ")}`;
      finalQuery += constraintString.length ? " " : "";
    }
    if (constraintString.length) {
      finalQuery += `ADD CONSTRAINT ${constraintString.join(", ")}`;
    }
    return `ALTER TABLE ${this.quoteTable(tableName)} ${finalQuery}`;
  }
  renameTableQuery(before, after) {
    return `RENAME TABLE ${this.quoteTable(before)} TO ${this.quoteTable(after)}`;
  }
  renameColumnQuery(tableName, attrBefore, attributes) {
    const attrString = [];
    for (const attrName in attributes) {
      const definition = attributes[attrName];
      attrString.push(`\`${attrBefore}\` \`${attrName}\` ${definition}`);
    }
    return `ALTER TABLE ${this.quoteTable(tableName)} RENAME COLUMN ${attrString.join(", ")};`;
  }
  handleSequelizeMethod(smth, tableName, factory, options, prepend) {
    if (smth instanceof Utils.Json) {
      if (smth.conditions) {
        const conditions = this.parseConditionObject(smth.conditions).map((condition) => `${this.quoteIdentifier(condition.path[0])}->>'$.${_.tail(condition.path).join(".")}' = '${condition.value}'`);
        return conditions.join(" and ");
      }
      if (smth.path) {
        let str;
        if (this._checkValidJsonStatement(smth.path)) {
          str = smth.path;
        } else {
          let path = smth.path;
          let startWithDot = true;
          path = path.replace(/\.(\d+)\./g, "[$1].");
          path = path.replace(/\.(\d+)$/, "[$1]");
          path = path.split(".");
          let columnName = path.shift();
          const match = columnName.match(/\[\d+\]$/);
          if (match !== null) {
            path.unshift(columnName.slice(match.index));
            columnName = columnName.slice(0, Math.max(0, match.index));
            startWithDot = false;
          }
          str = `${this.quoteIdentifier(columnName)}->>'$${startWithDot ? "." : ""}${path.join(".")}'`;
        }
        if (smth.value) {
          str += util.format(" = %s", this.escape(smth.value, void 0, { replacements: options.replacements }));
        }
        return str;
      }
    } else if (smth instanceof Utils.Cast) {
      if (/timestamp/i.test(smth.type)) {
        smth.type = "timestamp";
      } else if (smth.json && /boolean/i.test(smth.type)) {
        smth.type = "char";
      } else if (/double precision/i.test(smth.type) || /boolean/i.test(smth.type) || /integer/i.test(smth.type)) {
        smth.type = "integer";
      } else if (/text/i.test(smth.type)) {
        smth.type = "char";
      }
    }
    return super.handleSequelizeMethod(smth, tableName, factory, options, prepend);
  }
  escape(value, field, options) {
    options = options || {};
    if (value !== null && value !== void 0) {
      if (value instanceof Utils.SequelizeMethod) {
        return this.handleSequelizeMethod(value, void 0, void 0, options);
      }
      if (field && field.type) {
        this.validate(value, field, options);
        if (field.type.stringify) {
          if (field.type._binary) {
            field.type.escape = false;
          }
          const simpleEscape = (escVal) => SqlString.escape(escVal, this.options.timezone, this.dialect);
          value = field.type.stringify(value, { escape: simpleEscape, field, timezone: this.options.timezone, operation: options.operation });
          if (field.type.escape === false) {
            return value;
          }
        }
      }
    }
    const format = value === null && options.where;
    return SqlString.escape(value, this.options.timezone, this.dialect, format);
  }
  addIndexQuery(tableName, _attributes, _options, rawTablename) {
    let options = _options || /* @__PURE__ */ Object.create(null);
    if (!Array.isArray(_attributes)) {
      options = _attributes;
    } else {
      options.fields = _attributes;
    }
    options.prefix = options.prefix || rawTablename || tableName;
    if (options.prefix && typeof options.prefix === "string") {
      options.prefix = options.prefix.replace(/\./g, "_");
      options.prefix = options.prefix.replace(/("|')/g, "");
    }
    const fieldsSql = options.fields.map((field) => {
      if (typeof field === "string") {
        return this.quoteIdentifier(field);
      }
      if (field instanceof Utils.SequelizeMethod) {
        return this.handleSequelizeMethod(field);
      }
      let result = "";
      if (field.attribute) {
        field.name = field.attribute;
      }
      if (!field.name) {
        throw new Error(`The following index field has no name: ${util.inspect(field)}`);
      }
      result += this.quoteIdentifier(field.name);
      if (this._dialect.supports.index.length && field.length) {
        result += `(${field.length})`;
      }
      if (field.order) {
        result += ` ${field.order}`;
      }
      return result;
    });
    if (!options.name) {
      options = Utils.nameIndex(options, options.prefix);
    }
    options = Model._conformIndex(options);
    if (!this._dialect.supports.index.type) {
      delete options.type;
    }
    if (options.where) {
      options.where = this.whereQuery(options.where);
    }
    if (typeof tableName === "string") {
      tableName = this.quoteIdentifiers(tableName);
    } else {
      tableName = this.quoteTable(tableName);
    }
    let schema;
    if (typeof options.schema === "string") {
      schema = this.quoteIdentifiers(options.schema);
    }
    if (options.unique) {
      return `BEGIN
      DECLARE CONTINUE HANDLER FOR SQLSTATE VALUE '42891'
        BEGIN END;
        ALTER TABLE ${tableName} ADD CONSTRAINT ${this.quoteIdentifiers(options.name)} UNIQUE (${fieldsSql.join(", ")}${options.operator ? ` ${options.operator}` : ""})${options.where ? ` ${options.where}` : ""};
      END`;
    }
    return `CREATE${options.unique ? " UNIQUE" : ""} INDEX ${schema ? ` ${schema}.` : ""}${this.quoteIdentifiers(options.name)} ON ${tableName} (${fieldsSql.join(", ")}${options.operator ? ` ${options.operator}` : ""})${options.where ? ` ${options.where}` : ""}`;
  }
  addConstraintQuery(tableName, options) {
    const query = super.addConstraintQuery(tableName, options);
    return query.replace(/;$/, "");
  }
  updateQuery(tableName, attrValueHash, where, options, columnDefinitions) {
    const out = super.updateQuery(tableName, attrValueHash, where, options, columnDefinitions);
    out.query = (0, import_utils.removeTrailingSemicolon)(out.query);
    return out;
  }
  arithmeticQuery(operator, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options) {
    return (0, import_utils.removeTrailingSemicolon)(super.arithmeticQuery(operator, tableName, where, incrementAmountsByField, extraAttributesToBeUpdated, options));
  }
  upsertQuery(tableName, insertValues, updateValues, where, model, options) {
    const aliasTable = `temp_${this.quoteTable(tableName)}`;
    let query = `MERGE INTO ${this.quoteTable(tableName)} `;
    const usingClause = `USING (
      SELECT * FROM (${this.quoteTable(tableName)}
      VALUES(42)
      ) AS ${aliasTable}("id") ON (${aliasTable}."id" = ${this.quoteTable(tableName)}."id")`;
    query += usingClause;
    query += ` WHEN MATCHED THEN ${this.updateQuery(tableName, tableName, where, options, updateValues)}
    WHEN NOT MATCHED THEN ${this.insertQuery(tableName, insertValues, model, options).sql}`;
    return query;
  }
  insertQuery(table, valueHash, modelAttributes, options) {
    const query = super.insertQuery(table, valueHash, modelAttributes, options);
    if (query.query[query.query.length - 1] === ";") {
      query.query = query.query.slice(0, -1);
      query.query = `SELECT * FROM FINAL TABLE (${query.query})`;
    }
    return query;
  }
  selectQuery(tableName, options, model) {
    let query = super.selectQuery(tableName, options, model);
    if (query[query.length - 1] === ";") {
      query = query.slice(0, -1);
    }
    return query;
  }
  bulkInsertQuery(tableName, fieldValueHashes, options, fieldMappedAttributes) {
    let query = super.bulkInsertQuery(tableName, fieldValueHashes, options, fieldMappedAttributes);
    if (query[query.length - 1] === ";") {
      query = query.slice(0, -1);
      query = `SELECT * FROM FINAL TABLE (${query})`;
    }
    return query;
  }
  truncateTableQuery(tableName) {
    return `TRUNCATE TABLE ${this.quoteTable(tableName)} IMMEDIATE`;
  }
  deleteQuery(tableName, where, options = {}, model) {
    let query = `DELETE FROM ${this.quoteTable(tableName)}`;
    where = this.getWhereConditions(where, null, model, options);
    if (where) {
      query += ` WHERE ${where}`;
    }
    if (options.offset || options.limit) {
      query += this.addLimitAndOffset(options, model);
    }
    return query;
  }
  addLimitAndOffset(options) {
    let fragment = "";
    if (options.offset) {
      fragment += ` OFFSET ${this.escape(options.offset, void 0, options)} ROWS`;
    }
    if (options.limit) {
      fragment += ` FETCH NEXT ${this.escape(options.limit, void 0, options)} ROWS ONLY`;
    }
    return fragment;
  }
  showIndexesQuery(tableName) {
    let table;
    let schema;
    if (typeof tableName === "string") {
      table = tableName;
    } else {
      table = tableName.tableName || tableName.table;
      schema = tableName.schema;
    }
    const sql = `select
      QSYS2.SYSCSTCOL.CONSTRAINT_NAME as NAME,
      QSYS2.SYSCSTCOL.COLUMN_NAME,
      QSYS2.SYSCST.CONSTRAINT_TYPE,
      QSYS2.SYSCST.TABLE_SCHEMA,
      QSYS2.SYSCST.TABLE_NAME
    from
      QSYS2.SYSCSTCOL
    left outer join
      QSYS2.SYSCST
    on
      QSYS2.SYSCSTCOL.TABLE_SCHEMA = QSYS2.SYSCST.TABLE_SCHEMA
      and
      QSYS2.SYSCSTCOL.TABLE_NAME = QSYS2.SYSCST.TABLE_NAME
      and
      QSYS2.SYSCSTCOL.CONSTRAINT_NAME = QSYS2.SYSCST.CONSTRAINT_NAME
    where
      QSYS2.SYSCSTCOL.TABLE_SCHEMA = ${schema ? `'${schema}'` : "CURRENT SCHEMA"}
      and
      QSYS2.SYSCSTCOL.TABLE_NAME = '${table}'
    union
    select
      QSYS2.SYSKEYS.INDEX_NAME AS NAME,
      QSYS2.SYSKEYS.COLUMN_NAME,
      CAST('INDEX' AS VARCHAR(11)),
      QSYS2.SYSINDEXES.TABLE_SCHEMA,
      QSYS2.SYSINDEXES.TABLE_NAME
    from
      QSYS2.SYSKEYS
    left outer join
      QSYS2.SYSINDEXES
    on
      QSYS2.SYSKEYS.INDEX_NAME = QSYS2.SYSINDEXES.INDEX_NAME
    where
      QSYS2.SYSINDEXES.TABLE_SCHEMA = ${schema ? `'${schema}'` : "CURRENT SCHEMA"}
      and
      QSYS2.SYSINDEXES.TABLE_NAME = '${table}'`;
    return sql;
  }
  showConstraintsQuery(table, constraintName) {
    const tableName = table.tableName || table;
    const schemaName = table.schema;
    let sql = [
      'SELECT CONSTRAINT_NAME AS "constraintName",',
      'CONSTRAINT_SCHEMA AS "constraintSchema",',
      'CONSTRAINT_TYPE AS "constraintType",',
      'TABLE_NAME AS "tableName",',
      'TABLE_SCHEMA AS "tableSchema"',
      "from QSYS2.SYSCST",
      `WHERE table_name='${tableName}'`
    ].join(" ");
    if (constraintName) {
      sql += ` AND CONSTRAINT_NAME = '${constraintName}'`;
    }
    if (schemaName) {
      sql += ` AND TABLE_SCHEMA = '${schemaName}'`;
    }
    return sql;
  }
  removeIndexQuery(tableName, indexNameOrAttributes) {
    let indexName = indexNameOrAttributes;
    if (typeof indexName !== "string") {
      indexName = Utils.underscore(`${tableName}_${indexNameOrAttributes.join("_")}`);
    }
    return `BEGIN IF EXISTS (SELECT * FROM QSYS2.SYSINDEXES WHERE INDEX_NAME = '${indexName}') THEN DROP INDEX "${indexName}"; COMMIT; END IF; END`;
  }
  attributeToSQL(attribute, options) {
    if (!_.isPlainObject(attribute)) {
      attribute = {
        type: attribute
      };
    }
    const attributeString = attribute.type.toString({ escape: this.escape.bind(this) });
    let template = attributeString;
    if (attribute.type instanceof DataTypes.ENUM) {
      if (attribute.type.values && !attribute.values) {
        attribute.values = attribute.type.values;
      }
      template = attribute.type.toSql();
      if (options && options.context) {
        template += options.context === "changeColumn" ? " ADD" : "";
      }
      template += ` CHECK (${this.quoteIdentifier(attribute.field)} IN(${attribute.values.map((value) => {
        return this.escape(value, void 0, { replacements: options == null ? void 0 : options.replacements });
      }).join(", ")}))`;
    } else {
      template = attribute.type.toString(options);
    }
    if (attribute.allowNull === false) {
      template += " NOT NULL";
    } else if (attribute.allowNull === true && (options && options.context === "changeColumn")) {
      template += " DROP NOT NULL";
    }
    if (attribute.autoIncrement) {
      template += " GENERATED BY DEFAULT AS IDENTITY (START WITH 1, INCREMENT BY 1)";
    }
    if (!typeWithoutDefault.has(attributeString) && attribute.type._binary !== true && Utils.defaultValueSchemable(attribute.defaultValue)) {
      if (attribute.defaultValue === true) {
        attribute.defaultValue = 1;
      } else if (attribute.defaultValue === false) {
        attribute.defaultValue = 0;
      }
      template += ` DEFAULT ${this.escape(attribute.defaultValue, void 0, { replacements: options == null ? void 0 : options.replacements })}`;
    }
    if (attribute.unique === true && !attribute.primaryKey) {
      template += " UNIQUE";
    }
    if (attribute.primaryKey) {
      template += " PRIMARY KEY";
    }
    if (attribute.first) {
      template += " FIRST";
    }
    if (attribute.after) {
      template += ` AFTER ${this.quoteIdentifier(attribute.after)}`;
    }
    if (attribute.references) {
      if (options && options.context === "addColumn" && options.foreignKey) {
        const attrName = this.quoteIdentifier(options.foreignKey);
        const fkName = this.quoteIdentifier(`${options.tableName}_${attrName}_foreign_idx`);
        template += ` ADD CONSTRAINT ${fkName} FOREIGN KEY (${attrName})`;
      }
      template += ` REFERENCES ${this.quoteTable(attribute.references.model)}`;
      if (attribute.references.key) {
        template += ` (${this.quoteIdentifier(attribute.references.key)})`;
      } else {
        template += ` (${this.quoteIdentifier("id")})`;
      }
      if (attribute.onDelete) {
        template += ` ON DELETE ${attribute.onDelete.toUpperCase()}`;
      }
      if (attribute.onUpdate && attribute.onUpdate.toUpperCase() !== "CASCADE") {
        template += ` ON UPDATE ${attribute.onUpdate.toUpperCase()}`;
      }
    }
    return template;
  }
  attributesToSQL(attributes, options) {
    const result = /* @__PURE__ */ Object.create(null);
    for (const key in attributes) {
      const attribute = attributes[key];
      attribute.field = attribute.field || key;
      result[attribute.field || key] = this.attributeToSQL(attribute, options);
    }
    return result;
  }
  getForeignKeysQuery(table, schemaName) {
    const quotedSchemaName = schemaName ? wrapSingleQuote(schemaName) : "CURRENT SCHEMA";
    const quotedTableName = wrapSingleQuote(table.tableName || table);
    const sql = [
      'SELECT FK_NAME AS "constraintName",',
      'PKTABLE_CAT AS "referencedTableCatalog",',
      'PKTABLE_SCHEM AS "referencedTableSchema",',
      'PKTABLE_NAME AS "referencedTableName",',
      'PKCOLUMN_NAME AS "referencedColumnName",',
      'FKTABLE_CAT AS "tableCatalog",',
      'FKTABLE_SCHEM AS "tableSchema",',
      'FKTABLE_NAME AS "tableName",',
      'FKTABLE_SCHEM AS "tableSchema",',
      'FKCOLUMN_NAME AS "columnName"',
      "FROM SYSIBM.SQLFOREIGNKEYS",
      `WHERE FKTABLE_SCHEM = ${quotedSchemaName}`,
      `AND FKTABLE_NAME = ${quotedTableName}`
    ].join(" ");
    return sql;
  }
  getForeignKeyQuery(table, columnName) {
    const quotedSchemaName = table.schema ? wrapSingleQuote(table.schema) : "CURRENT SCHEMA";
    const quotedTableName = wrapSingleQuote(table.tableName || table);
    const quotedColumnName = wrapSingleQuote(columnName);
    const sql = [
      'SELECT FK_NAME AS "constraintName",',
      'PKTABLE_CAT AS "referencedTableCatalog",',
      'PKTABLE_SCHEM AS "referencedTableSchema",',
      'PKTABLE_NAME AS "referencedTableName",',
      'PKCOLUMN_NAME AS "referencedColumnName",',
      'FKTABLE_CAT AS "tableCatalog",',
      'FKTABLE_SCHEM AS "tableSchema",',
      'FKTABLE_NAME AS "tableName",',
      'FKTABLE_SCHEM AS "tableSchema",',
      'FKCOLUMN_NAME AS "columnName"',
      "FROM SYSIBM.SQLFOREIGNKEYS",
      `WHERE FKTABLE_SCHEM = ${quotedSchemaName}`,
      `AND FKTABLE_NAME = ${quotedTableName}`,
      `AND FKCOLUMN_NAME = ${quotedColumnName}`
    ].join(" ");
    return sql;
  }
  dropForeignKeyQuery(tableName, foreignKey) {
    return `ALTER TABLE ${this.quoteTable(tableName)}
      DROP FOREIGN KEY ${this.quoteIdentifier(foreignKey)};`;
  }
  booleanValue(value) {
    if (value) {
      return 1;
    }
    return 0;
  }
  quoteIdentifier(identifier, _force) {
    return Utils.addTicks(Utils.removeTicks(identifier, '"'), '"');
  }
}
function wrapSingleQuote(identifier) {
  return Utils.addTicks(identifier, "'");
}
//# sourceMappingURL=query-generator.js.map
