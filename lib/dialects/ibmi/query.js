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
var query_exports = {};
__export(query_exports, {
  IBMiQuery: () => IBMiQuery
});
module.exports = __toCommonJS(query_exports);
const _ = require("lodash");
const { AbstractQuery } = require("../abstract/query");
const parserStore = require("../parserStore")("ibmi");
const sequelizeErrors = require("../../errors");
const { logger } = require("../../utils/logger");
const debug = logger.debugContext("sql:ibmi");
class IBMiQuery extends AbstractQuery {
  getInsertIdField() {
    return "id";
  }
  async run(sql, parameters) {
    const stacktrace = new Error().stack;
    this.sql = sql.replace(/;$/, "");
    return new Promise((resolve, reject) => {
      const complete = this._logQuery(sql, debug, parameters);
      this.connection.query(this.sql, parameters, (error, results) => {
        if (error) {
          const formattedError = this.formatError(error, stacktrace);
          reject(formattedError);
          return;
        }
        complete();
        for (const result of results) {
          for (const column of results.columns) {
            const typeId = column.dataType;
            const parse = parserStore.get(typeId);
            const value = result[column.name];
            if (value !== null && parse) {
              result[column.name] = parse(value);
            }
          }
        }
        resolve(results);
      });
    }).then((results) => this.formatResults(results));
  }
  formatResults(data) {
    let result = this.instance;
    if (this.isInsertQuery() || this.isUpdateQuery() || this.isUpsertQuery()) {
      if (this.instance && this.instance.dataValues) {
        for (const key in data[0]) {
          if (Object.prototype.hasOwnProperty.call(data[0], key)) {
            const record = data[0][key];
            const attr = _.find(this.model.rawAttributes, (attribute) => attribute.fieldName === key || attribute.field === key);
            this.instance.dataValues[attr && attr.fieldName || key] = record;
          }
        }
      }
      if (this.isUpsertQuery()) {
        return [
          this.instance,
          null
        ];
      }
      return [
        this.instance || data && (this.options.plain && data[0] || data) || void 0,
        data.count
      ];
    }
    if (this.isSelectQuery()) {
      return this.handleSelectQuery(data);
    }
    if (this.isShowTablesQuery()) {
      return this.handleShowTablesQuery(data);
    }
    if (this.isShowIndexesQuery()) {
      return this.handleShowIndexesQuery(data);
    }
    if (this.isDescribeQuery()) {
      result = {};
      for (const _result of data) {
        const enumRegex = /^enum/i;
        result[_result.COLUMN_NAME] = {
          type: enumRegex.test(_result.Type) ? _result.Type.replace(enumRegex, "ENUM") : _result.DATA_TYPE.toUpperCase(),
          allowNull: _result.IS_NULLABLE === "Y",
          defaultValue: _result.COLUMN_DEFAULT,
          primaryKey: _result.CONSTRAINT_TYPE === "PRIMARY KEY",
          autoIncrement: _result.IS_GENERATED !== "IDENTITY_GENERATION"
        };
      }
      return result;
    }
    if (this.isCallQuery()) {
      return data[0];
    }
    if (this.isBulkUpdateQuery() || this.isBulkDeleteQuery() || this.isUpsertQuery()) {
      return data.count;
    }
    if (this.isVersionQuery()) {
      return data[0].VERSION;
    }
    if (this.isForeignKeysQuery()) {
      return data;
    }
    if (this.isInsertQuery(data)) {
      return [result, data.length];
    }
    if (this.isUpdateQuery()) {
      return [result, data.count];
    }
    if (this.isShowConstraintsQuery()) {
      return data;
    }
    if (this.isRawQuery()) {
      return [data, data];
    }
    if (this.isShowIndexesQuery()) {
      return data;
    }
    return result;
  }
  handleInsertQuery(results, metaData) {
    if (this.instance) {
      const autoIncrementAttribute = this.model.autoIncrementAttribute.field;
      let id = null;
      id = id || results && results[autoIncrementAttribute];
      id = id || metaData && metaData[autoIncrementAttribute];
      this.instance[this.model.autoIncrementAttribute] = id;
    }
  }
  handleShowIndexesQuery(data) {
    const indexes = /* @__PURE__ */ Object.create(null);
    data.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(indexes, item.NAME)) {
        indexes[item.NAME].fields.push({ attribute: item.COLUMN_NAME, length: void 0, order: void 0, collate: void 0 });
      } else {
        indexes[item.NAME] = {
          primary: item.CONSTRAINT_TYPE === "PRIMARY KEY",
          fields: [{ attribute: item.COLUMN_NAME, length: void 0, order: void 0, collate: void 0 }],
          name: item.NAME,
          tableName: item.TABLE_NAME,
          unique: item.CONSTRAINT_TYPE === "PRIMARY KEY" || item.CONSTRAINT_TYPE === "UNIQUE",
          type: item.CONSTRAINT_TYPE
        };
      }
    });
    return Object.values(indexes);
  }
  formatError(err, stacktrace) {
    if (err.toString().includes("Error connecting to the database")) {
      return new sequelizeErrors.ConnectionRefusedError(err);
    }
    if (Object.prototype.hasOwnProperty.call(err, "odbcErrors") && err.odbcErrors.length > 0) {
      const odbcError = err.odbcErrors[0];
      const foreignKeyConstraintCodes = [
        -530,
        -531,
        -532
      ];
      const uniqueConstraintCodes = [
        -803
      ];
      if (foreignKeyConstraintCodes.includes(odbcError.code)) {
        return new sequelizeErrors.ForeignKeyConstraintError({
          cause: err,
          sql: {},
          fields: {},
          stack: stacktrace
        });
      }
      if (uniqueConstraintCodes.includes(odbcError.code)) {
        return new sequelizeErrors.UniqueConstraintError({
          errors: err.odbcErrors,
          cause: err,
          sql: {},
          fields: {},
          stack: stacktrace
        });
      }
      if (odbcError.code === -204) {
        let constraintName;
        let type;
        const constraintNameRegex = /"([^)]+?)" in [^]+? type (\*\w+?) not found./;
        const constraintNameRegexMatches = odbcError.message.match(constraintNameRegex);
        if (constraintNameRegexMatches && constraintNameRegexMatches.length === 3) {
          constraintName = constraintNameRegexMatches[1];
          type = constraintNameRegexMatches[2];
          if (type === "*N") {
            return new sequelizeErrors.UnknownConstraintError({
              cause: err,
              constraint: constraintName
            });
          }
        }
      }
      return new sequelizeErrors.DatabaseError(odbcError, { stack: stacktrace });
    }
    return err;
  }
}
//# sourceMappingURL=query.js.map
