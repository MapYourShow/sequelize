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
  Db2QueryGenerator: () => Db2QueryGenerator
});
module.exports = __toCommonJS(query_generator_exports);
var import_utils = require("../../utils");
const _ = require("lodash");
const Utils = require("../../utils");
const DataTypes = require("../../data-types");
const { AbstractQueryGenerator } = require("../abstract/query-generator");
const randomBytes = require("crypto").randomBytes;
const { Op } = require("../../operators");
function throwMethodUndefined(methodName) {
  throw new Error(`The method "${methodName}" is not defined! Please add it to your sql dialect.`);
}
class Db2QueryGenerator extends AbstractQueryGenerator {
  constructor(options) {
    super(options);
    this.OperatorMap = __spreadProps(__spreadValues({}, this.OperatorMap), {
      [Op.regexp]: "REGEXP_LIKE",
      [Op.notRegexp]: "NOT REGEXP_LIKE"
    });
    this.autoGenValue = 1;
  }
  createSchema(schema) {
    return [
      "CREATE SCHEMA",
      this.quoteIdentifier(schema),
      ";"
    ].join(" ");
  }
  dropSchema(schema) {
    const query = `CALL SYSPROC.ADMIN_DROP_SCHEMA(${wrapSingleQuote(schema.trim())}, NULL, $sequelize_1, $sequelize_2)`;
    return {
      query,
      bind: {
        sequelize_1: { ParamType: "INOUT", Data: "ERRORSCHEMA" },
        sequelize_2: { ParamType: "INOUT", Data: "ERRORTABLE" }
      }
    };
  }
  showSchemasQuery() {
    return `SELECT SCHEMANAME AS "schema_name" FROM SYSCAT.SCHEMATA WHERE (SCHEMANAME NOT LIKE 'SYS%') AND SCHEMANAME NOT IN ('NULLID', 'SQLJ', 'ERRORSCHEMA')`;
  }
  versionQuery() {
    return "select service_level as VERSION from TABLE (sysproc.env_get_inst_info()) as A";
  }
  createTableQuery(tableName, attributes, options) {
    const query = "CREATE TABLE <%= table %> (<%= attributes %>)";
    const primaryKeys = [];
    const foreignKeys = {};
    const attrStr = [];
    const commentTemplate = " -- <%= comment %>, TableName = <%= table %>, ColumnName = <%= column %>;";
    let commentStr = "";
    for (const attr in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
        let dataType = attributes[attr];
        let match;
        if (dataType.includes("COMMENT ")) {
          const commentMatch = dataType.match(/^(.+) (COMMENT.*)$/);
          if (commentMatch && commentMatch.length > 2) {
            const commentText = commentMatch[2].replace(/COMMENT/, "").trim();
            commentStr += _.template(commentTemplate, this._templateSettings)({
              table: this.quoteIdentifier(tableName),
              comment: this.escape(commentText, void 0, { replacements: options.replacements }),
              column: this.quoteIdentifier(attr)
            });
            dataType = commentMatch[1];
          }
        }
        if (_.includes(dataType, "PRIMARY KEY")) {
          primaryKeys.push(attr);
          if (_.includes(dataType, "REFERENCES")) {
            match = dataType.match(/^(.+) (REFERENCES.*)$/);
            attrStr.push(`${this.quoteIdentifier(attr)} ${match[1].replace(/PRIMARY KEY/, "")}`);
            foreignKeys[attr] = match[2];
          } else {
            attrStr.push(`${this.quoteIdentifier(attr)} ${dataType.replace(/PRIMARY KEY/, "")}`);
          }
        } else if (_.includes(dataType, "REFERENCES")) {
          match = dataType.match(/^(.+) (REFERENCES.*)$/);
          attrStr.push(`${this.quoteIdentifier(attr)} ${match[1]}`);
          foreignKeys[attr] = match[2];
        } else {
          if (options && options.uniqueKeys) {
            for (const ukey in options.uniqueKeys) {
              if (options.uniqueKeys[ukey].fields.includes(attr) && !_.includes(dataType, "NOT NULL")) {
                dataType += " NOT NULL";
                break;
              }
            }
          }
          attrStr.push(`${this.quoteIdentifier(attr)} ${dataType}`);
        }
      }
    }
    const values = {
      table: this.quoteTable(tableName),
      attributes: attrStr.join(", ")
    };
    const pkString = primaryKeys.map((pk) => {
      return this.quoteIdentifier(pk);
    }).join(", ");
    if (options && options.uniqueKeys) {
      _.each(options.uniqueKeys, (columns, indexName) => {
        if (columns.customIndex) {
          if (!_.isString(indexName)) {
            indexName = `uniq_${tableName}_${columns.fields.join("_")}`;
          }
          values.attributes += `, CONSTRAINT ${this.quoteIdentifier(indexName)} UNIQUE (${columns.fields.map((field) => this.quoteIdentifier(field)).join(", ")})`;
        }
      });
    }
    if (pkString.length > 0) {
      values.attributes += `, PRIMARY KEY (${pkString})`;
    }
    for (const fkey in foreignKeys) {
      if (Object.prototype.hasOwnProperty.call(foreignKeys, fkey)) {
        values.attributes += `, FOREIGN KEY (${this.quoteIdentifier(fkey)}) ${foreignKeys[fkey]}`;
      }
    }
    return `${_.template(query, this._templateSettings)(values).trim()};${commentStr}`;
  }
  describeTableQuery(tableName, schema) {
    let sql = [
      'SELECT NAME AS "Name", TBNAME AS "Table", TBCREATOR AS "Schema",',
      'TRIM(COLTYPE) AS "Type", LENGTH AS "Length", SCALE AS "Scale",',
      'NULLS AS "IsNull", DEFAULT AS "Default", COLNO AS "Colno",',
      'IDENTITY AS "IsIdentity", KEYSEQ AS "KeySeq", REMARKS AS "Comment"',
      "FROM",
      "SYSIBM.SYSCOLUMNS",
      "WHERE TBNAME =",
      wrapSingleQuote(tableName)
    ].join(" ");
    if (schema) {
      sql += ` AND TBCREATOR =${wrapSingleQuote(schema)}`;
    } else {
      sql += " AND TBCREATOR = USER";
    }
    return `${sql};`;
  }
  renameTableQuery(before, after) {
    const query = "RENAME TABLE <%= before %> TO <%= after %>;";
    return _.template(query, this._templateSettings)({
      before: this.quoteTable(before),
      after: this.quoteTable(after)
    });
  }
  showTablesQuery() {
    return `SELECT TABNAME AS "tableName", TRIM(TABSCHEMA) AS "tableSchema" FROM SYSCAT.TABLES WHERE TABSCHEMA = USER AND TYPE = 'T' ORDER BY TABSCHEMA, TABNAME`;
  }
  dropTableQuery(tableName) {
    const query = "DROP TABLE <%= table %>";
    const values = {
      table: this.quoteTable(tableName)
    };
    return `${_.template(query, this._templateSettings)(values).trim()};`;
  }
  addColumnQuery(table, key, dataType) {
    dataType.field = key;
    const query = "ALTER TABLE <%= table %> ADD <%= attribute %>;";
    const attribute = _.template("<%= key %> <%= definition %>", this._templateSettings)({
      key: this.quoteIdentifier(key),
      definition: this.attributeToSQL(dataType, {
        context: "addColumn"
      })
    });
    return _.template(query, this._templateSettings)({
      table: this.quoteTable(table),
      attribute
    });
  }
  removeColumnQuery(tableName, attributeName) {
    const query = "ALTER TABLE <%= tableName %> DROP COLUMN <%= attributeName %>;";
    return _.template(query, this._templateSettings)({
      tableName: this.quoteTable(tableName),
      attributeName: this.quoteIdentifier(attributeName)
    });
  }
  changeColumnQuery(tableName, attributes) {
    const query = "ALTER TABLE <%= tableName %> <%= query %>;";
    const attrString = [];
    const constraintString = [];
    for (const attributeName in attributes) {
      const attrValue = attributes[attributeName];
      let defs = [attrValue];
      if (Array.isArray(attrValue)) {
        defs = attrValue;
      }
      for (const definition of defs) {
        if (/REFERENCES/.test(definition)) {
          constraintString.push(_.template("<%= fkName %> FOREIGN KEY (<%= attrName %>) <%= definition %>", this._templateSettings)({
            fkName: this.quoteIdentifier(`${attributeName}_foreign_idx`),
            attrName: this.quoteIdentifier(attributeName),
            definition: definition.replace(/.+?(?=REFERENCES)/, "")
          }));
        } else if (_.startsWith(definition, "DROP ")) {
          attrString.push(_.template("<%= attrName %> <%= definition %>", this._templateSettings)({
            attrName: this.quoteIdentifier(attributeName),
            definition
          }));
        } else {
          attrString.push(_.template("<%= attrName %> SET <%= definition %>", this._templateSettings)({
            attrName: this.quoteIdentifier(attributeName),
            definition
          }));
        }
      }
    }
    let finalQuery = "";
    if (attrString.length > 0) {
      finalQuery += `ALTER COLUMN ${attrString.join(" ALTER COLUMN ")}`;
      finalQuery += constraintString.length > 0 ? " " : "";
    }
    if (constraintString.length > 0) {
      finalQuery += `ADD CONSTRAINT ${constraintString.join(" ADD CONSTRAINT ")}`;
    }
    return _.template(query, this._templateSettings)({
      tableName: this.quoteTable(tableName),
      query: finalQuery
    });
  }
  renameColumnQuery(tableName, attrBefore, attributes) {
    const query = "ALTER TABLE <%= tableName %> RENAME COLUMN <%= before %> TO <%= after %>;";
    const newName = Object.keys(attributes)[0];
    return _.template(query, this._templateSettings)({
      tableName: this.quoteTable(tableName),
      before: this.quoteIdentifier(attrBefore),
      after: this.quoteIdentifier(newName)
    });
  }
  addConstraintQuery(tableName, options) {
    options = options || {};
    if (options.onUpdate && options.onUpdate.toUpperCase() === "CASCADE") {
      delete options.onUpdate;
    }
    const constraintSnippet = this.getConstraintSnippet(tableName, options);
    if (typeof tableName === "string") {
      tableName = this.quoteIdentifiers(tableName);
    } else {
      tableName = this.quoteTable(tableName);
    }
    return `ALTER TABLE ${tableName} ADD ${constraintSnippet};`;
  }
  bulkInsertQuery(tableName, attrValueHashes, options, attributes) {
    options = options || {};
    attributes = attributes || {};
    let query = "INSERT INTO <%= table %> (<%= attributes %>)<%= output %> VALUES <%= tuples %>;";
    if (options.returning) {
      query = "SELECT * FROM FINAL TABLE (INSERT INTO <%= table %> (<%= attributes %>)<%= output %> VALUES <%= tuples %>);";
    }
    const emptyQuery = "INSERT INTO <%= table %>";
    const tuples = [];
    const allAttributes = [];
    const allQueries = [];
    let outputFragment;
    const valuesForEmptyQuery = [];
    if (options.returning) {
      outputFragment = "";
    }
    _.forEach(attrValueHashes, (attrValueHash) => {
      const fields = Object.keys(attrValueHash);
      const firstAttr = attributes[fields[0]];
      if (fields.length === 1 && firstAttr && firstAttr.autoIncrement && attrValueHash[fields[0]] === null) {
        valuesForEmptyQuery.push(`(${this.autoGenValue++})`);
        return;
      }
      _.forOwn(attrValueHash, (value, key) => {
        if (!allAttributes.includes(key)) {
          if (value === null && attributes[key] && attributes[key].autoIncrement) {
            return;
          }
          allAttributes.push(key);
        }
      });
    });
    if (valuesForEmptyQuery.length > 0) {
      allQueries.push(`${emptyQuery} VALUES ${valuesForEmptyQuery.join(",")}`);
    }
    if (allAttributes.length > 0) {
      _.forEach(attrValueHashes, (attrValueHash) => {
        tuples.push(`(${allAttributes.map((key) => this.escape(attrValueHash[key], void 0, { context: "INSERT", replacements: options.replacements })).join(",")})`);
      });
      allQueries.push(query);
    }
    const replacements = {
      table: this.quoteTable(tableName),
      attributes: allAttributes.map((attr) => this.quoteIdentifier(attr)).join(","),
      tuples,
      output: outputFragment
    };
    const generatedQuery = _.template(allQueries.join(";"), this._templateSettings)(replacements);
    return generatedQuery;
  }
  updateQuery(tableName, attrValueHash, where, options, attributes) {
    const sql = super.updateQuery(tableName, attrValueHash, where, options, attributes);
    options = options || {};
    _.defaults(options, this.options);
    if (!options.limit) {
      sql.query = `SELECT * FROM FINAL TABLE (${(0, import_utils.removeTrailingSemicolon)(sql.query)});`;
      return sql;
    }
    attrValueHash = Utils.removeNullishValuesFromHash(attrValueHash, options.omitNull, options);
    const modelAttributeMap = {};
    const values = [];
    const bind = {};
    const bindParam = options.bindParam || this.bindParam(bind);
    if (attributes) {
      _.each(attributes, (attribute, key) => {
        modelAttributeMap[key] = attribute;
        if (attribute.field) {
          modelAttributeMap[attribute.field] = attribute;
        }
      });
    }
    for (const key in attrValueHash) {
      const value = attrValueHash[key];
      if (value instanceof Utils.SequelizeMethod || options.bindParam === false) {
        values.push(`${this.quoteIdentifier(key)}=${this.escape(value, modelAttributeMap && modelAttributeMap[key] || void 0, { context: "UPDATE", replacements: options.replacements })}`);
      } else {
        values.push(`${this.quoteIdentifier(key)}=${this.format(value, modelAttributeMap && modelAttributeMap[key] || void 0, { context: "UPDATE", replacements: options.replacements }, bindParam)}`);
      }
    }
    let query;
    const whereOptions = _.defaults({ bindParam }, options);
    query = `UPDATE (SELECT * FROM ${this.quoteTable(tableName)} ${this.whereQuery(where, whereOptions)} FETCH NEXT ${this.escape(options.limit, void 0, { replacements: options.replacements })} ROWS ONLY) SET ${values.join(",")}`;
    query = `SELECT * FROM FINAL TABLE (${query});`;
    return { query, bind };
  }
  upsertQuery(tableName, insertValues, updateValues, where, model, options) {
    const targetTableAlias = this.quoteTable(`${tableName}_target`);
    const sourceTableAlias = this.quoteTable(`${tableName}_source`);
    const primaryKeysAttrs = [];
    const identityAttrs = [];
    const uniqueAttrs = [];
    const tableNameQuoted = this.quoteTable(tableName);
    for (const key in model.rawAttributes) {
      if (model.rawAttributes[key].primaryKey) {
        primaryKeysAttrs.push(model.rawAttributes[key].field || key);
      }
      if (model.rawAttributes[key].unique) {
        uniqueAttrs.push(model.rawAttributes[key].field || key);
      }
      if (model.rawAttributes[key].autoIncrement) {
        identityAttrs.push(model.rawAttributes[key].field || key);
      }
    }
    for (const index of model._indexes) {
      if (index.unique && index.fields) {
        for (const field of index.fields) {
          const fieldName = typeof field === "string" ? field : field.name || field.attribute;
          if (!uniqueAttrs.includes(fieldName) && model.rawAttributes[fieldName]) {
            uniqueAttrs.push(fieldName);
          }
        }
      }
    }
    const updateKeys = Object.keys(updateValues);
    const insertKeys = Object.keys(insertValues);
    const insertKeysQuoted = insertKeys.map((key) => this.quoteIdentifier(key)).join(", ");
    const insertValuesEscaped = insertKeys.map((key) => this.escape(insertValues[key], void 0, { replacements: options.replacements })).join(", ");
    const sourceTableQuery = `VALUES(${insertValuesEscaped})`;
    let joinCondition;
    const clauses = where[Op.or].filter((clause) => {
      let valid = true;
      for (const key of Object.keys(clause)) {
        if (clause[key] == null) {
          valid = false;
          break;
        }
      }
      return valid;
    });
    const getJoinSnippet = (array) => {
      return array.map((key) => {
        key = this.quoteIdentifier(key);
        return `${targetTableAlias}.${key} = ${sourceTableAlias}.${key}`;
      });
    };
    if (clauses.length === 0) {
      throw new Error("Primary Key or Unique key should be passed to upsert query");
    } else {
      for (const key in clauses) {
        const keys = Object.keys(clauses[key]);
        if (primaryKeysAttrs.includes(keys[0])) {
          joinCondition = getJoinSnippet(primaryKeysAttrs).join(" AND ");
          break;
        }
      }
      if (!joinCondition) {
        joinCondition = getJoinSnippet(uniqueAttrs).join(" AND ");
      }
    }
    const filteredUpdateClauses = updateKeys.filter((key) => {
      if (!identityAttrs.includes(key)) {
        return true;
      }
      return false;
    }).map((key) => {
      const value = this.escape(updateValues[key], void 0, { replacements: options.replacements });
      key = this.quoteIdentifier(key);
      return `${targetTableAlias}.${key} = ${value}`;
    }).join(", ");
    const updateSnippet = filteredUpdateClauses.length > 0 ? `WHEN MATCHED THEN UPDATE SET ${filteredUpdateClauses}` : "";
    const insertSnippet = `(${insertKeysQuoted}) VALUES(${insertValuesEscaped})`;
    let query = `MERGE INTO ${tableNameQuoted} AS ${targetTableAlias} USING (${sourceTableQuery}) AS ${sourceTableAlias}(${insertKeysQuoted}) ON ${joinCondition}`;
    query += ` ${updateSnippet} WHEN NOT MATCHED THEN INSERT ${insertSnippet};`;
    return query;
  }
  truncateTableQuery(tableName) {
    return `TRUNCATE TABLE ${this.quoteTable(tableName)} IMMEDIATE`;
  }
  deleteQuery(tableName, where, options = {}, model) {
    const table = this.quoteTable(tableName);
    let whereStr = this.getWhereConditions(where, null, model, options);
    if (whereStr) {
      whereStr = ` WHERE ${whereStr}`;
    }
    let query = `DELETE FROM ${table} ${whereStr}`;
    if (options.offset > 0) {
      query += ` OFFSET ${this.escape(options.offset, void 0, { replacements: options.replacements })} ROWS`;
    }
    if (options.limit) {
      query += ` FETCH NEXT ${this.escape(options.limit, void 0, { replacements: options.replacements })} ROWS ONLY`;
    }
    return query.trim();
  }
  showIndexesQuery(tableName) {
    let sql = 'SELECT NAME AS "name", TBNAME AS "tableName", UNIQUERULE AS "keyType", COLNAMES, INDEXTYPE AS "type" FROM SYSIBM.SYSINDEXES WHERE TBNAME = <%= tableName %>';
    let schema;
    if (_.isObject(tableName)) {
      schema = tableName.schema;
      tableName = tableName.tableName;
    }
    if (schema) {
      sql = `${sql} AND TBCREATOR = <%= schemaName %>`;
    }
    sql = `${sql} ORDER BY NAME;`;
    return _.template(sql, this._templateSettings)({
      tableName: wrapSingleQuote(tableName),
      schemaName: wrapSingleQuote(schema)
    });
  }
  showConstraintsQuery(tableName, constraintName) {
    let sql = `SELECT CONSTNAME AS "constraintName", TRIM(TABSCHEMA) AS "schemaName", TABNAME AS "tableName" FROM SYSCAT.TABCONST WHERE TABNAME = '${tableName}'`;
    if (constraintName) {
      sql += ` AND CONSTNAME LIKE '%${constraintName}%'`;
    }
    return `${sql} ORDER BY CONSTNAME;`;
  }
  removeIndexQuery(tableName, indexNameOrAttributes) {
    const sql = "DROP INDEX <%= indexName %>";
    let indexName = indexNameOrAttributes;
    if (typeof indexName !== "string") {
      indexName = Utils.underscore(`${tableName}_${indexNameOrAttributes.join("_")}`);
    }
    const values = {
      tableName: this.quoteIdentifiers(tableName),
      indexName: this.quoteIdentifiers(indexName)
    };
    return _.template(sql, this._templateSettings)(values);
  }
  attributeToSQL(attribute, options) {
    if (!_.isPlainObject(attribute)) {
      attribute = {
        type: attribute
      };
    }
    let template;
    let changeNull = 1;
    if (attribute.type instanceof DataTypes.ENUM) {
      if (attribute.type.values && !attribute.values) {
        attribute.values = attribute.type.values;
      }
      template = attribute.type.toSql();
      template += ` CHECK (${this.quoteIdentifier(attribute.field)} IN(${attribute.values.map((value) => {
        return this.escape(value, void 0, { replacements: options == null ? void 0 : options.replacements });
      }).join(", ")}))`;
    } else {
      template = attribute.type.toString();
    }
    if (options && options.context === "changeColumn" && attribute.type) {
      template = `DATA TYPE ${template}`;
    } else if (attribute.allowNull === false || attribute.primaryKey === true || attribute.unique) {
      template += " NOT NULL";
      changeNull = 0;
    }
    if (attribute.autoIncrement) {
      let initialValue = 1;
      if (attribute.initialAutoIncrement) {
        initialValue = attribute.initialAutoIncrement;
      }
      template += ` GENERATED BY DEFAULT AS IDENTITY(START WITH ${initialValue}, INCREMENT BY 1)`;
    }
    if (attribute.type !== "TEXT" && attribute.type._binary !== true && Utils.defaultValueSchemable(attribute.defaultValue)) {
      template += ` DEFAULT ${this.escape(attribute.defaultValue, void 0, { replacements: options == null ? void 0 : options.replacements })}`;
    }
    if (attribute.unique === true) {
      template += " UNIQUE";
    }
    if (attribute.primaryKey) {
      template += " PRIMARY KEY";
    }
    if (attribute.references) {
      if (options && options.context === "addColumn" && options.foreignKey) {
        const attrName = this.quoteIdentifier(options.foreignKey);
        const fkName = `${options.tableName}_${attrName}_fidx`;
        template += `, CONSTRAINT ${fkName} FOREIGN KEY (${attrName})`;
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
    if (options && options.context === "changeColumn" && changeNull === 1 && attribute.allowNull !== void 0) {
      template = [template];
      if (attribute.allowNull) {
        template.push("DROP NOT NULL");
      } else {
        template.push("NOT NULL");
      }
    }
    if (attribute.comment && typeof attribute.comment === "string") {
      template += ` COMMENT ${attribute.comment}`;
    }
    return template;
  }
  attributesToSQL(attributes, options) {
    const result = {};
    const existingConstraints = [];
    let key;
    let attribute;
    for (key in attributes) {
      attribute = attributes[key];
      if (attribute.references) {
        if (existingConstraints.includes(attribute.references.model.toString())) {
          attribute.onDelete = "";
          attribute.onUpdate = "";
        } else if (attribute.unique && attribute.unique === true) {
          attribute.onDelete = "";
          attribute.onUpdate = "";
        } else {
          existingConstraints.push(attribute.references.model.toString());
        }
      }
      if (key && !attribute.field && typeof attribute === "object") {
        attribute.field = key;
      }
      result[attribute.field || key] = this.attributeToSQL(attribute, options);
    }
    return result;
  }
  createTrigger() {
    throwMethodUndefined("createTrigger");
  }
  dropTrigger() {
    throwMethodUndefined("dropTrigger");
  }
  renameTrigger() {
    throwMethodUndefined("renameTrigger");
  }
  createFunction() {
    throwMethodUndefined("createFunction");
  }
  dropFunction() {
    throwMethodUndefined("dropFunction");
  }
  renameFunction() {
    throwMethodUndefined("renameFunction");
  }
  _getForeignKeysQuerySQL(condition) {
    return `SELECT R.CONSTNAME AS "constraintName", TRIM(R.TABSCHEMA) AS "constraintSchema", R.TABNAME AS "tableName", TRIM(R.TABSCHEMA) AS "tableSchema", LISTAGG(C.COLNAME,', ') WITHIN GROUP (ORDER BY C.COLNAME) AS "columnName", TRIM(R.REFTABSCHEMA) AS "referencedTableSchema", R.REFTABNAME AS "referencedTableName", TRIM(R.PK_COLNAMES) AS "referencedColumnName" FROM SYSCAT.REFERENCES R, SYSCAT.KEYCOLUSE C WHERE R.CONSTNAME = C.CONSTNAME AND R.TABSCHEMA = C.TABSCHEMA AND R.TABNAME = C.TABNAME${condition} GROUP BY R.REFTABSCHEMA, R.REFTABNAME, R.TABSCHEMA, R.TABNAME, R.CONSTNAME, R.PK_COLNAMES`;
  }
  getForeignKeysQuery(table, schemaName) {
    const tableName = table.tableName || table;
    schemaName = table.schema || schemaName;
    let sql = "";
    if (tableName) {
      sql = ` AND R.TABNAME = ${wrapSingleQuote(tableName)}`;
    }
    if (schemaName) {
      sql += ` AND R.TABSCHEMA = ${wrapSingleQuote(schemaName)}`;
    }
    return this._getForeignKeysQuerySQL(sql);
  }
  getForeignKeyQuery(table, columnName) {
    const tableName = table.tableName || table;
    const schemaName = table.schema;
    let sql = "";
    if (tableName) {
      sql = ` AND R.TABNAME = ${wrapSingleQuote(tableName)}`;
    }
    if (schemaName) {
      sql += ` AND R.TABSCHEMA = ${wrapSingleQuote(schemaName)}`;
    }
    if (columnName) {
      sql += ` AND C.COLNAME = ${wrapSingleQuote(columnName)}`;
    }
    return this._getForeignKeysQuerySQL(sql);
  }
  getPrimaryKeyConstraintQuery(table, attributeName) {
    const tableName = wrapSingleQuote(table.tableName || table);
    return [
      'SELECT TABNAME AS "tableName",',
      'COLNAME AS "columnName",',
      'CONSTNAME AS "constraintName"',
      "FROM SYSCAT.KEYCOLUSE WHERE CONSTNAME LIKE 'PK_%'",
      `AND COLNAME = ${wrapSingleQuote(attributeName)}`,
      `AND TABNAME = ${tableName};`
    ].join(" ");
  }
  dropForeignKeyQuery(tableName, foreignKey) {
    return _.template("ALTER TABLE <%= table %> DROP <%= key %>", this._templateSettings)({
      table: this.quoteTable(tableName),
      key: this.quoteIdentifier(foreignKey)
    });
  }
  dropConstraintQuery(tableName, constraintName) {
    const sql = "ALTER TABLE <%= table %> DROP CONSTRAINT <%= constraint %>;";
    return _.template(sql, this._templateSettings)({
      table: this.quoteTable(tableName),
      constraint: this.quoteIdentifier(constraintName)
    });
  }
  setAutocommitQuery() {
    return "";
  }
  setIsolationLevelQuery() {
  }
  generateTransactionId() {
    return randomBytes(10).toString("hex");
  }
  startTransactionQuery(transaction) {
    if (transaction.parent) {
      return `SAVE TRANSACTION ${this.quoteIdentifier(transaction.name)};`;
    }
    return "BEGIN TRANSACTION;";
  }
  commitTransactionQuery(transaction) {
    if (transaction.parent) {
      return;
    }
    return "COMMIT TRANSACTION;";
  }
  rollbackTransactionQuery(transaction) {
    if (transaction.parent) {
      return `ROLLBACK TRANSACTION ${this.quoteIdentifier(transaction.name)};`;
    }
    return "ROLLBACK TRANSACTION;";
  }
  addLimitAndOffset(options) {
    const offset = options.offset || 0;
    let fragment = "";
    if (offset) {
      fragment += ` OFFSET ${this.escape(offset, void 0, { replacements: options.replacements })} ROWS`;
    }
    if (options.limit) {
      fragment += ` FETCH NEXT ${this.escape(options.limit, void 0, { replacements: options.replacements })} ROWS ONLY`;
    }
    return fragment;
  }
  booleanValue(value) {
    return value ? 1 : 0;
  }
  addUniqueFields(dataValues, rawAttributes, uniqno) {
    uniqno = uniqno === void 0 ? 1 : uniqno;
    for (const key in rawAttributes) {
      if (rawAttributes[key].unique && dataValues[key] === void 0) {
        if (rawAttributes[key].type instanceof DataTypes.DATE) {
          dataValues[key] = Utils.now("db2");
        } else if (rawAttributes[key].type instanceof DataTypes.STRING) {
          dataValues[key] = `unique${uniqno++}`;
        } else if (rawAttributes[key].type instanceof DataTypes.INTEGER) {
          dataValues[key] = uniqno++;
        } else if (rawAttributes[key].type instanceof DataTypes.BOOLEAN) {
          dataValues[key] = new DataTypes.BOOLEAN(false);
        }
      }
    }
    return uniqno;
  }
  quoteIdentifier(identifier, _force) {
    return Utils.addTicks(Utils.removeTicks(identifier, '"'), '"');
  }
}
function wrapSingleQuote(identifier) {
  if (identifier) {
    return `'${identifier}'`;
  }
  return "";
}
//# sourceMappingURL=query-generator.js.map
