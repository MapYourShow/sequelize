"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  SnowflakeQueryGenerator: () => SnowflakeQueryGenerator
});
module.exports = __toCommonJS(query_generator_exports);
const _ = require("lodash");
const Utils = require("../../utils");
const { AbstractQueryGenerator } = require("../abstract/query-generator");
const util = require("util");
const { Op } = require("../../operators");
const JSON_FUNCTION_REGEX = /^\s*((?:[a-z]+_){0,2}jsonb?(?:_[a-z]+){0,2})\([^)]*\)/i;
const JSON_OPERATOR_REGEX = /^\s*(->>?|@>|<@|\?[&|]?|\|{2}|#-)/i;
const TOKEN_CAPTURE_REGEX = /^\s*((?:(["'`])(?:(?!\2).|\2{2})*\2)|[\s\w]+|[()+,.;-])/i;
const FOREIGN_KEY_FIELDS = [
  "CONSTRAINT_NAME as constraint_name",
  "CONSTRAINT_NAME as constraintName",
  "CONSTRAINT_SCHEMA as constraintSchema",
  "CONSTRAINT_SCHEMA as constraintCatalog",
  "TABLE_NAME as tableName",
  "TABLE_SCHEMA as tableSchema",
  "TABLE_SCHEMA as tableCatalog",
  "COLUMN_NAME as columnName",
  "REFERENCED_TABLE_SCHEMA as referencedTableSchema",
  "REFERENCED_TABLE_SCHEMA as referencedTableCatalog",
  "REFERENCED_TABLE_NAME as referencedTableName",
  "REFERENCED_COLUMN_NAME as referencedColumnName"
].join(",");
const SNOWFLAKE_RESERVED_WORDS = "account,all,alter,and,any,as,between,by,case,cast,check,column,connect,connections,constraint,create,cross,current,current_date,current_time,current_timestamp,current_user,database,delete,distinct,drop,else,exists,false,following,for,from,full,grant,group,gscluster,having,ilike,in,increment,inner,insert,intersect,into,is,issue,join,lateral,left,like,localtime,localtimestamp,minus,natural,not,null,of,on,or,order,organization,qualify,regexp,revoke,right,rlike,row,rows,sample,schema,select,set,some,start,table,tablesample,then,to,trigger,true,try_cast,union,unique,update,using,values,view,when,whenever,where,with".split(",");
const typeWithoutDefault = /* @__PURE__ */ new Set(["BLOB", "TEXT", "GEOMETRY", "JSON"]);
class SnowflakeQueryGenerator extends AbstractQueryGenerator {
  constructor(options) {
    super(options);
    this.OperatorMap = __spreadProps(__spreadValues({}, this.OperatorMap), {
      [Op.regexp]: "REGEXP",
      [Op.notRegexp]: "NOT REGEXP"
    });
  }
  createDatabaseQuery(databaseName, options) {
    options = __spreadValues({
      charset: null,
      collate: null
    }, options);
    return Utils.joinSQLFragments([
      "CREATE DATABASE IF NOT EXISTS",
      this.quoteIdentifier(databaseName),
      options.charset && `DEFAULT CHARACTER SET ${this.escape(options.charset, void 0, options)}`,
      options.collate && `DEFAULT COLLATE ${this.escape(options.collate, void 0, options)}`,
      ";"
    ]);
  }
  dropDatabaseQuery(databaseName) {
    return `DROP DATABASE IF EXISTS ${this.quoteIdentifier(databaseName)};`;
  }
  createSchema() {
    return "SHOW TABLES";
  }
  showSchemasQuery() {
    return "SHOW TABLES";
  }
  versionQuery() {
    return "SELECT CURRENT_VERSION()";
  }
  createTableQuery(tableName, attributes, options) {
    options = __spreadValues({
      charset: null,
      rowFormat: null
    }, options);
    const primaryKeys = [];
    const foreignKeys = {};
    const attrStr = [];
    for (const attr in attributes) {
      if (!Object.prototype.hasOwnProperty.call(attributes, attr)) {
        continue;
      }
      const dataType = attributes[attr];
      let match;
      if (dataType.includes("PRIMARY KEY")) {
        primaryKeys.push(attr);
        if (dataType.includes("REFERENCES")) {
          match = dataType.match(/^(.+) (REFERENCES.*)$/);
          attrStr.push(`${this.quoteIdentifier(attr)} ${match[1].replace("PRIMARY KEY", "")}`);
          foreignKeys[attr] = match[2];
        } else {
          attrStr.push(`${this.quoteIdentifier(attr)} ${dataType.replace("PRIMARY KEY", "")}`);
        }
      } else if (dataType.includes("REFERENCES")) {
        match = dataType.match(/^(.+) (REFERENCES.*)$/);
        attrStr.push(`${this.quoteIdentifier(attr)} ${match[1]}`);
        foreignKeys[attr] = match[2];
      } else {
        attrStr.push(`${this.quoteIdentifier(attr)} ${dataType}`);
      }
    }
    const table = this.quoteTable(tableName);
    let attributesClause = attrStr.join(", ");
    const pkString = primaryKeys.map((pk) => this.quoteIdentifier(pk)).join(", ");
    if (options.uniqueKeys) {
      _.each(options.uniqueKeys, (columns, indexName) => {
        if (columns.customIndex) {
          if (typeof indexName !== "string") {
            indexName = `uniq_${tableName}_${columns.fields.join("_")}`;
          }
          attributesClause += `, UNIQUE ${this.quoteIdentifier(indexName)} (${columns.fields.map((field) => this.quoteIdentifier(field)).join(", ")})`;
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
    return Utils.joinSQLFragments([
      "CREATE TABLE IF NOT EXISTS",
      table,
      `(${attributesClause})`,
      options.comment && typeof options.comment === "string" && `COMMENT ${this.escape(options.comment, void 0, options)}`,
      options.charset && `DEFAULT CHARSET=${options.charset}`,
      options.collate && `COLLATE ${options.collate}`,
      options.rowFormat && `ROW_FORMAT=${options.rowFormat}`,
      ";"
    ]);
  }
  describeTableQuery(tableName, schema, schemaDelimiter) {
    const table = this.quoteTable(this.addSchema({
      tableName,
      _schema: schema,
      _schemaDelimiter: schemaDelimiter
    }));
    return `SHOW FULL COLUMNS FROM ${table};`;
  }
  showTablesQuery(database, options) {
    return Utils.joinSQLFragments([
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'",
      database ? `AND TABLE_SCHEMA = ${this.escape(database, void 0, options)}` : "AND TABLE_SCHEMA NOT IN ( 'INFORMATION_SCHEMA', 'PERFORMANCE_SCHEMA', 'SYS')",
      ";"
    ]);
  }
  addColumnQuery(table, key, dataType) {
    return Utils.joinSQLFragments([
      "ALTER TABLE",
      this.quoteTable(table),
      "ADD",
      this.quoteIdentifier(key),
      this.attributeToSQL(dataType, {
        context: "addColumn",
        tableName: table,
        foreignKey: key
      }),
      ";"
    ]);
  }
  removeColumnQuery(tableName, attributeName) {
    return Utils.joinSQLFragments([
      "ALTER TABLE",
      this.quoteTable(tableName),
      "DROP",
      this.quoteIdentifier(attributeName),
      ";"
    ]);
  }
  changeColumnQuery(tableName, attributes) {
    const query = (...subQuerys) => Utils.joinSQLFragments([
      "ALTER TABLE",
      this.quoteTable(tableName),
      "ALTER COLUMN",
      ...subQuerys,
      ";"
    ]);
    const sql = [];
    for (const attributeName in attributes) {
      let definition = this.dataTypeMapping(tableName, attributeName, attributes[attributeName]);
      const attrSql = [];
      if (definition.includes("NOT NULL")) {
        attrSql.push(query(this.quoteIdentifier(attributeName), "SET NOT NULL"));
        definition = definition.replace("NOT NULL", "").trim();
      } else if (!definition.includes("REFERENCES")) {
        attrSql.push(query(this.quoteIdentifier(attributeName), "DROP NOT NULL"));
      }
      if (definition.includes("DEFAULT")) {
        attrSql.push(query(this.quoteIdentifier(attributeName), "SET DEFAULT", definition.match(/DEFAULT ([^;]+)/)[1]));
        definition = definition.replace(/(DEFAULT[^;]+)/, "").trim();
      } else if (!definition.includes("REFERENCES")) {
        attrSql.push(query(this.quoteIdentifier(attributeName), "DROP DEFAULT"));
      }
      if (/UNIQUE;*$/.test(definition)) {
        definition = definition.replace(/UNIQUE;*$/, "");
        attrSql.push(query("ADD UNIQUE (", this.quoteIdentifier(attributeName), ")").replace("ALTER COLUMN", ""));
      }
      if (definition.includes("REFERENCES")) {
        definition = definition.replace(/.+?(?=REFERENCES)/, "");
        attrSql.push(query("ADD FOREIGN KEY (", this.quoteIdentifier(attributeName), ")", definition).replace("ALTER COLUMN", ""));
      } else {
        attrSql.push(query(this.quoteIdentifier(attributeName), "TYPE", definition));
      }
      sql.push(attrSql.join(""));
    }
    return sql.join("");
  }
  renameColumnQuery(tableName, attrBefore, attributes) {
    const attrString = [];
    for (const attrName in attributes) {
      const definition = attributes[attrName];
      attrString.push(`'${attrBefore}' '${attrName}' ${definition}`);
    }
    return Utils.joinSQLFragments([
      "ALTER TABLE",
      this.quoteTable(tableName),
      "RENAME COLUMN",
      attrString.join(" to "),
      ";"
    ]);
  }
  handleSequelizeMethod(attr, tableName, factory, options, prepend) {
    if (attr instanceof Utils.Json) {
      if (attr.conditions) {
        const conditions = this.parseConditionObject(attr.conditions).map((condition) => `${this.jsonPathExtractionQuery(condition.path[0], _.tail(condition.path))} = '${condition.value}'`);
        return conditions.join(" AND ");
      }
      if (attr.path) {
        let str;
        if (this._checkValidJsonStatement(attr.path)) {
          str = attr.path;
        } else {
          const paths = _.toPath(attr.path);
          const column = paths.shift();
          str = this.jsonPathExtractionQuery(column, paths);
        }
        if (attr.value) {
          str += util.format(" = %s", this.escape(attr.value, void 0, options));
        }
        return str;
      }
    } else if (attr instanceof Utils.Cast) {
      if (/timestamp/i.test(attr.type)) {
        attr.type = "datetime";
      } else if (attr.json && /boolean/i.test(attr.type)) {
        attr.type = "char";
      } else if (/double precision/i.test(attr.type) || /boolean/i.test(attr.type) || /integer/i.test(attr.type)) {
        attr.type = "decimal";
      } else if (/text/i.test(attr.type)) {
        attr.type = "char";
      }
    }
    return super.handleSequelizeMethod(attr, tableName, factory, options, prepend);
  }
  truncateTableQuery(tableName) {
    return Utils.joinSQLFragments([
      "TRUNCATE",
      this.quoteTable(tableName)
    ]);
  }
  deleteQuery(tableName, where, options = {}, model) {
    const table = this.quoteTable(tableName);
    let whereClause = this.getWhereConditions(where, null, model, options);
    const limit = options.limit && ` LIMIT ${this.escape(options.limit, void 0, options)}`;
    let primaryKeys = "";
    let primaryKeysSelection = "";
    if (whereClause) {
      whereClause = `WHERE ${whereClause}`;
    }
    if (limit) {
      if (!model) {
        throw new Error("Cannot LIMIT delete without a model.");
      }
      const pks = Object.values(model.primaryKeys).map((pk) => this.quoteIdentifier(pk.field)).join(",");
      primaryKeys = model.primaryKeyAttributes.length > 1 ? `(${pks})` : pks;
      primaryKeysSelection = pks;
      return Utils.joinSQLFragments([
        "DELETE FROM",
        table,
        "WHERE",
        primaryKeys,
        "IN (SELECT",
        primaryKeysSelection,
        "FROM",
        table,
        whereClause,
        limit,
        ")"
      ]);
    }
    return Utils.joinSQLFragments([
      "DELETE FROM",
      table,
      whereClause
    ]);
  }
  showIndexesQuery() {
    return "SELECT '' FROM DUAL";
  }
  showConstraintsQuery(table, constraintName) {
    const tableName = table.tableName || table;
    const schemaName = table.schema;
    return Utils.joinSQLFragments([
      "SELECT CONSTRAINT_CATALOG AS constraintCatalog,",
      "CONSTRAINT_NAME AS constraintName,",
      "CONSTRAINT_SCHEMA AS constraintSchema,",
      "CONSTRAINT_TYPE AS constraintType,",
      "TABLE_NAME AS tableName,",
      "TABLE_SCHEMA AS tableSchema",
      "from INFORMATION_SCHEMA.TABLE_CONSTRAINTS",
      `WHERE table_name='${tableName}'`,
      constraintName && `AND constraint_name = '${constraintName}'`,
      schemaName && `AND TABLE_SCHEMA = '${schemaName}'`,
      ";"
    ]);
  }
  removeIndexQuery(tableName, indexNameOrAttributes) {
    let indexName = indexNameOrAttributes;
    if (typeof indexName !== "string") {
      indexName = Utils.underscore(`${tableName}_${indexNameOrAttributes.join("_")}`);
    }
    return Utils.joinSQLFragments([
      "DROP INDEX",
      this.quoteIdentifier(indexName),
      "ON",
      this.quoteTable(tableName),
      ";"
    ]);
  }
  attributeToSQL(attribute, options) {
    if (!_.isPlainObject(attribute)) {
      attribute = {
        type: attribute
      };
    }
    const attributeString = attribute.type.toString({ escape: this.escape.bind(this) });
    let template = attributeString;
    if (attribute.allowNull === false) {
      template += " NOT NULL";
    }
    if (attribute.autoIncrement) {
      template += " AUTOINCREMENT";
    }
    if (!typeWithoutDefault.has(attributeString) && attribute.type._binary !== true && Utils.defaultValueSchemable(attribute.defaultValue)) {
      template += ` DEFAULT ${this.escape(attribute.defaultValue, void 0, options)}`;
    }
    if (attribute.unique === true) {
      template += " UNIQUE";
    }
    if (attribute.primaryKey) {
      template += " PRIMARY KEY";
    }
    if (attribute.comment) {
      template += ` COMMENT ${this.escape(attribute.comment, void 0, options)}`;
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
        template += `, ADD CONSTRAINT ${fkName} FOREIGN KEY (${attrName})`;
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
      if (attribute.onUpdate) {
        template += ` ON UPDATE ${attribute.onUpdate.toUpperCase()}`;
      }
    }
    return template;
  }
  attributesToSQL(attributes, options) {
    const result = {};
    for (const key in attributes) {
      const attribute = attributes[key];
      result[attribute.field || key] = this.attributeToSQL(attribute, options);
    }
    return result;
  }
  _checkValidJsonStatement(stmt) {
    if (typeof stmt !== "string") {
      return false;
    }
    let currentIndex = 0;
    let openingBrackets = 0;
    let closingBrackets = 0;
    let hasJsonFunction = false;
    let hasInvalidToken = false;
    while (currentIndex < stmt.length) {
      const string = stmt.slice(currentIndex);
      const functionMatches = JSON_FUNCTION_REGEX.exec(string);
      if (functionMatches) {
        currentIndex += functionMatches[0].indexOf("(");
        hasJsonFunction = true;
        continue;
      }
      const operatorMatches = JSON_OPERATOR_REGEX.exec(string);
      if (operatorMatches) {
        currentIndex += operatorMatches[0].length;
        hasJsonFunction = true;
        continue;
      }
      const tokenMatches = TOKEN_CAPTURE_REGEX.exec(string);
      if (tokenMatches) {
        const capturedToken = tokenMatches[1];
        if (capturedToken === "(") {
          openingBrackets++;
        } else if (capturedToken === ")") {
          closingBrackets++;
        } else if (capturedToken === ";") {
          hasInvalidToken = true;
          break;
        }
        currentIndex += tokenMatches[0].length;
        continue;
      }
      break;
    }
    if (hasJsonFunction && (hasInvalidToken || openingBrackets !== closingBrackets)) {
      throw new Error(`Invalid json statement: ${stmt}`);
    }
    return hasJsonFunction;
  }
  dataTypeMapping(tableName, attr, dataType) {
    if (dataType.includes("PRIMARY KEY")) {
      dataType = dataType.replace("PRIMARY KEY", "");
    }
    if (dataType.includes("SERIAL")) {
      if (dataType.includes("BIGINT")) {
        dataType = dataType.replace("SERIAL", "BIGSERIAL");
        dataType = dataType.replace("BIGINT", "");
      } else if (dataType.includes("SMALLINT")) {
        dataType = dataType.replace("SERIAL", "SMALLSERIAL");
        dataType = dataType.replace("SMALLINT", "");
      } else {
        dataType = dataType.replace("INTEGER", "");
      }
      dataType = dataType.replace("NOT NULL", "");
    }
    return dataType;
  }
  getForeignKeysQuery(table, schemaName) {
    const tableName = table.tableName || table;
    return Utils.joinSQLFragments([
      "SELECT",
      FOREIGN_KEY_FIELDS,
      `FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE where TABLE_NAME = '${tableName}'`,
      `AND CONSTRAINT_NAME!='PRIMARY' AND CONSTRAINT_SCHEMA='${schemaName}'`,
      "AND REFERENCED_TABLE_NAME IS NOT NULL",
      ";"
    ]);
  }
  getForeignKeyQuery(table, columnName) {
    const quotedSchemaName = table.schema ? wrapSingleQuote(table.schema) : "";
    const quotedTableName = wrapSingleQuote(table.tableName || table);
    const quotedColumnName = wrapSingleQuote(columnName);
    return Utils.joinSQLFragments([
      "SELECT",
      FOREIGN_KEY_FIELDS,
      "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE",
      "WHERE (",
      [
        `REFERENCED_TABLE_NAME = ${quotedTableName}`,
        table.schema && `AND REFERENCED_TABLE_SCHEMA = ${quotedSchemaName}`,
        `AND REFERENCED_COLUMN_NAME = ${quotedColumnName}`
      ],
      ") OR (",
      [
        `TABLE_NAME = ${quotedTableName}`,
        table.schema && `AND TABLE_SCHEMA = ${quotedSchemaName}`,
        `AND COLUMN_NAME = ${quotedColumnName}`,
        "AND REFERENCED_TABLE_NAME IS NOT NULL"
      ],
      ")"
    ]);
  }
  dropForeignKeyQuery(tableName, foreignKey) {
    return Utils.joinSQLFragments([
      "ALTER TABLE",
      this.quoteTable(tableName),
      "DROP FOREIGN KEY",
      this.quoteIdentifier(foreignKey),
      ";"
    ]);
  }
  addLimitAndOffset(options) {
    if (options.offset) {
      return ` LIMIT ${this.escape(options.limit ?? null, void 0, options)} OFFSET ${this.escape(options.offset, void 0, options)}`;
    }
    if (options.limit != null) {
      return ` LIMIT ${this.escape(options.limit, void 0, options)}`;
    }
    return "";
  }
  quoteIdentifier(identifier, force) {
    const optForceQuote = force || false;
    const optQuoteIdentifiers = this.options.quoteIdentifiers !== false;
    const rawIdentifier = Utils.removeTicks(identifier, '"');
    if (optForceQuote === true || optQuoteIdentifiers !== false || identifier.includes(".") || identifier.includes("->") || SNOWFLAKE_RESERVED_WORDS.includes(rawIdentifier.toLowerCase())) {
      return Utils.addTicks(rawIdentifier, '"');
    }
    return rawIdentifier;
  }
}
function wrapSingleQuote(identifier) {
  return Utils.addTicks(identifier, "'");
}
//# sourceMappingURL=query-generator.js.map
