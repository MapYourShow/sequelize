"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var query_exports = {};
__export(query_exports, {
  SqliteQuery: () => SqliteQuery
});
module.exports = __toCommonJS(query_exports);
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
const _ = require("lodash");
const Utils = require("../../utils");
const { AbstractQuery } = require("../abstract/query");
const { QueryTypes } = require("../../query-types");
const sequelizeErrors = require("../../errors");
const parserStore = require("../parserStore")("sqlite");
const { logger } = require("../../utils/logger");
const debug = logger.debugContext("sql:sqlite");
function stringifyIfBigint(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}
class SqliteQuery extends AbstractQuery {
  getInsertIdField() {
    return "lastID";
  }
  _collectModels(include, prefix) {
    const ret = {};
    if (include) {
      for (const _include of include) {
        let key;
        if (!prefix) {
          key = _include.as;
        } else {
          key = `${prefix}.${_include.as}`;
        }
        ret[key] = _include.model;
        if (_include.include) {
          _.merge(ret, this._collectModels(_include.include, key));
        }
      }
    }
    return ret;
  }
  _handleQueryResponse(metaData, columnTypes, err, results, errStack) {
    if (err) {
      err.sql = this.sql;
      throw this.formatError(err, errStack);
    }
    let result = this.instance;
    if (this.isInsertQuery(results, metaData) || this.isUpsertQuery()) {
      this.handleInsertQuery(results, metaData);
      if (!this.instance) {
        if (metaData.constructor.name === "Statement" && this.model && this.model.autoIncrementAttribute && this.model.autoIncrementAttribute === this.model.primaryKeyAttribute && this.model.rawAttributes[this.model.primaryKeyAttribute]) {
          const startId = metaData[this.getInsertIdField()] - metaData.changes + 1;
          result = [];
          for (let i = startId; i < startId + metaData.changes; i++) {
            result.push({ [this.model.rawAttributes[this.model.primaryKeyAttribute].field]: i });
          }
        } else {
          result = metaData[this.getInsertIdField()];
        }
      }
    }
    if (this.isShowTablesQuery()) {
      return results.map((row) => row.name);
    }
    if (this.isShowConstraintsQuery()) {
      result = results;
      if (results && results[0] && results[0].sql) {
        result = this.parseConstraintsFromSql(results[0].sql);
      }
      return result;
    }
    if (this.isSelectQuery()) {
      if (this.options.raw) {
        return this.handleSelectQuery(results);
      }
      const prefixes = this._collectModels(this.options.include);
      results = results.map((result2) => {
        return _.mapValues(result2, (value, name) => {
          let model;
          if (name.includes(".")) {
            const lastind = name.lastIndexOf(".");
            model = prefixes[name.slice(0, Math.max(0, lastind))];
            name = name.slice(lastind + 1);
          } else {
            model = this.options.model;
          }
          const tableName = model.getTableName().toString().replace(/`/g, "");
          const tableTypes = columnTypes[tableName] || {};
          if (tableTypes && !(name in tableTypes)) {
            _.forOwn(model.rawAttributes, (attribute, key) => {
              if (name === key && attribute.field) {
                name = attribute.field;
                return false;
              }
            });
          }
          return Object.prototype.hasOwnProperty.call(tableTypes, name) ? this.applyParsers(tableTypes[name], value) : value;
        });
      });
      return this.handleSelectQuery(results);
    }
    if (this.isShowOrDescribeQuery()) {
      return results;
    }
    if (this.sql.includes("PRAGMA INDEX_LIST")) {
      return this.handleShowIndexesQuery(results);
    }
    if (this.sql.includes("PRAGMA INDEX_INFO")) {
      return results;
    }
    if (this.sql.includes("PRAGMA TABLE_INFO")) {
      result = {};
      let defaultValue;
      for (const _result of results) {
        if (_result.dflt_value === null) {
          defaultValue = void 0;
        } else if (_result.dflt_value === "NULL") {
          defaultValue = null;
        } else {
          defaultValue = _result.dflt_value;
        }
        result[_result.name] = {
          type: _result.type,
          allowNull: _result.notnull === 0,
          defaultValue,
          primaryKey: _result.pk !== 0
        };
        if (result[_result.name].type === "TINYINT(1)") {
          result[_result.name].defaultValue = { 0: false, 1: true }[result[_result.name].defaultValue];
        }
        if (typeof result[_result.name].defaultValue === "string") {
          result[_result.name].defaultValue = result[_result.name].defaultValue.replace(/'/g, "");
        }
      }
      return result;
    }
    if (this.sql.includes("PRAGMA foreign_keys;")) {
      return results[0];
    }
    if (this.sql.includes("PRAGMA foreign_keys")) {
      return results;
    }
    if (this.sql.includes("PRAGMA foreign_key_list")) {
      return results;
    }
    if ([QueryTypes.BULKUPDATE, QueryTypes.BULKDELETE].includes(this.options.type)) {
      return metaData.changes;
    }
    if (this.options.type === QueryTypes.VERSION) {
      return results[0].version;
    }
    if (this.options.type === QueryTypes.RAW) {
      return [results, metaData];
    }
    if (this.isUpsertQuery()) {
      return [result, null];
    }
    if (this.isUpdateQuery() || this.isInsertQuery()) {
      return [result, metaData.changes];
    }
    return result;
  }
  async run(sql, parameters) {
    const conn = this.connection;
    this.sql = sql;
    const method = this.getDatabaseMethod();
    const complete = this._logQuery(sql, debug, parameters);
    return new Promise((resolve, reject) => {
      conn.serialize(async () => {
        const columnTypes = {};
        const errForStack = new Error();
        const executeSql = () => {
          if (sql.startsWith("-- ")) {
            return resolve();
          }
          const query = this;
          function afterExecute(executionError, results) {
            try {
              complete();
              resolve(query._handleQueryResponse(this, columnTypes, executionError, results, errForStack.stack));
              return;
            } catch (error) {
              reject(error);
            }
          }
          if (!parameters) {
            parameters = [];
          }
          if ((0, import_isPlainObject.default)(parameters)) {
            const newParameters = /* @__PURE__ */ Object.create(null);
            for (const key of Object.keys(parameters)) {
              newParameters[`$${key}`] = stringifyIfBigint(parameters[key]);
            }
            parameters = newParameters;
          } else {
            parameters = parameters.map(stringifyIfBigint);
          }
          conn[method](sql, parameters, afterExecute);
          return null;
        };
        if (this.getDatabaseMethod() === "all") {
          let tableNames = [];
          if (this.options && this.options.tableNames) {
            tableNames = this.options.tableNames;
          } else if (/from `(.*?)`/i.test(this.sql)) {
            tableNames.push(/from `(.*?)`/i.exec(this.sql)[1]);
          }
          tableNames = tableNames.filter((tableName) => !(tableName in columnTypes) && tableName !== "sqlite_master");
          if (tableNames.length === 0) {
            return executeSql();
          }
          await Promise.all(tableNames.map((tableName) => new Promise((resolve2) => {
            tableName = tableName.replace(/`/g, "");
            columnTypes[tableName] = {};
            conn.all(`PRAGMA table_info(\`${tableName}\`)`, (err, results) => {
              if (!err) {
                for (const result of results) {
                  columnTypes[tableName][result.name] = result.type;
                }
              }
              resolve2();
            });
          })));
        }
        return executeSql();
      });
    });
  }
  parseConstraintsFromSql(sql) {
    let constraints = sql.split("CONSTRAINT ");
    let referenceTableName;
    let referenceTableKeys;
    let updateAction;
    let deleteAction;
    constraints.splice(0, 1);
    constraints = constraints.map((constraintSql) => {
      if (constraintSql.includes("REFERENCES")) {
        updateAction = constraintSql.match(/ON UPDATE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/);
        deleteAction = constraintSql.match(/ON DELETE (CASCADE|SET NULL|RESTRICT|NO ACTION|SET DEFAULT)/);
        if (updateAction) {
          updateAction = updateAction[1];
        }
        if (deleteAction) {
          deleteAction = deleteAction[1];
        }
        const referencesRegex = /REFERENCES.+\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/;
        const referenceConditions = constraintSql.match(referencesRegex)[0].split(" ");
        referenceTableName = Utils.removeTicks(referenceConditions[1]);
        let columnNames = referenceConditions[2];
        columnNames = columnNames.replace(/\(|\)/g, "").split(", ");
        referenceTableKeys = columnNames.map((column) => Utils.removeTicks(column));
      }
      const constraintCondition = constraintSql.match(/\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/)[0];
      constraintSql = constraintSql.replace(/\(.+\)/, "");
      const constraint = constraintSql.split(" ");
      if (["PRIMARY", "FOREIGN"].includes(constraint[1])) {
        constraint[1] += " KEY";
      }
      return {
        constraintName: Utils.removeTicks(constraint[0]),
        constraintType: constraint[1],
        updateAction,
        deleteAction,
        sql: sql.replace(/"/g, "`"),
        constraintCondition,
        referenceTableName,
        referenceTableKeys
      };
    });
    return constraints;
  }
  applyParsers(type, value) {
    if (type.includes("(")) {
      type = type.slice(0, Math.max(0, type.indexOf("(")));
    }
    type = type.replace("UNSIGNED", "").replace("ZEROFILL", "");
    type = type.trim().toUpperCase();
    const parse = parserStore.get(type);
    if (value !== null && parse) {
      return parse(value, { timezone: this.sequelize.options.timezone });
    }
    return value;
  }
  formatError(err, errStack) {
    switch (err.code) {
      case "SQLITE_CONSTRAINT_UNIQUE":
      case "SQLITE_CONSTRAINT_PRIMARYKEY":
      case "SQLITE_CONSTRAINT_TRIGGER":
      case "SQLITE_CONSTRAINT_FOREIGNKEY":
      case "SQLITE_CONSTRAINT": {
        if (err.message.includes("FOREIGN KEY constraint failed")) {
          return new sequelizeErrors.ForeignKeyConstraintError({
            cause: err,
            stack: errStack
          });
        }
        let fields = [];
        let match = err.message.match(/columns (.*?) are/);
        if (match !== null && match.length >= 2) {
          fields = match[1].split(", ");
        } else {
          match = err.message.match(/UNIQUE constraint failed: (.*)/);
          if (match !== null && match.length >= 2) {
            fields = match[1].split(", ").map((columnWithTable) => columnWithTable.split(".")[1]);
          }
        }
        const errors = [];
        let message = "Validation error";
        for (const field of fields) {
          errors.push(new sequelizeErrors.ValidationErrorItem(this.getUniqueConstraintErrorMessage(field), "unique violation", field, this.instance && this.instance[field], this.instance, "not_unique"));
        }
        if (this.model) {
          _.forOwn(this.model.uniqueKeys, (constraint) => {
            if (_.isEqual(constraint.fields, fields) && Boolean(constraint.msg)) {
              message = constraint.msg;
              return false;
            }
          });
        }
        return new sequelizeErrors.UniqueConstraintError({ message, errors, cause: err, fields, stack: errStack });
      }
      case "SQLITE_BUSY":
        return new sequelizeErrors.TimeoutError(err, { stack: errStack });
      default:
        return new sequelizeErrors.DatabaseError(err, { stack: errStack });
    }
  }
  async handleShowIndexesQuery(data) {
    return Promise.all(data.reverse().map(async (item) => {
      item.fields = [];
      item.primary = false;
      item.unique = Boolean(item.unique);
      item.constraintName = item.name;
      const columns = await this.run(`PRAGMA INDEX_INFO(\`${item.name}\`)`);
      for (const column of columns) {
        item.fields[column.seqno] = {
          attribute: column.name,
          length: void 0,
          order: void 0
        };
      }
      return item;
    }));
  }
  getDatabaseMethod() {
    if (this.isInsertQuery() || this.isUpdateQuery() || this.isUpsertQuery() || this.isBulkUpdateQuery() || this.sql.toLowerCase().includes("CREATE TEMPORARY TABLE".toLowerCase()) || this.options.type === QueryTypes.BULKDELETE) {
      return "run";
    }
    return "all";
  }
}
//# sourceMappingURL=query.js.map
