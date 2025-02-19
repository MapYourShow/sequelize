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
  MsSqlQuery: () => MsSqlQuery
});
module.exports = __toCommonJS(query_exports);
const { AbstractQuery } = require("../abstract/query");
const sequelizeErrors = require("../../errors");
const parserStore = require("../parserStore")("mssql");
const _ = require("lodash");
const { logger } = require("../../utils/logger");
const debug = logger.debugContext("sql:mssql");
const minSafeIntegerAsBigInt = BigInt(Number.MIN_SAFE_INTEGER);
const maxSafeIntegerAsBigInt = BigInt(Number.MAX_SAFE_INTEGER);
function getScale(aNum) {
  if (!Number.isFinite(aNum)) {
    return 0;
  }
  let e = 1;
  while (Math.round(aNum * e) / e !== aNum) {
    e *= 10;
  }
  return Math.log10(e);
}
class MsSqlQuery extends AbstractQuery {
  getInsertIdField() {
    return "id";
  }
  getSQLTypeFromJsType(value, TYPES) {
    const paramType = { type: TYPES.NVarChar, typeOptions: {}, value };
    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        if (value >= -2147483648 && value <= 2147483647) {
          paramType.type = TYPES.Int;
        } else {
          paramType.type = TYPES.BigInt;
        }
      } else {
        paramType.type = TYPES.Numeric;
        paramType.typeOptions = { precision: 30, scale: getScale(value) };
      }
    } else if (typeof value === "bigint") {
      if (value < minSafeIntegerAsBigInt || value > maxSafeIntegerAsBigInt) {
        paramType.type = TYPES.VarChar;
        paramType.value = value.toString();
      } else {
        return this.getSQLTypeFromJsType(Number(value), TYPES);
      }
    } else if (typeof value === "boolean") {
      paramType.type = TYPES.Bit;
    }
    if (Buffer.isBuffer(value)) {
      paramType.type = TYPES.VarBinary;
    }
    return paramType;
  }
  async _run(connection, sql, parameters, errStack) {
    this.sql = sql;
    const { options } = this;
    const complete = this._logQuery(sql, debug, parameters);
    const query = new Promise((resolve, reject) => {
      if (sql.startsWith("BEGIN TRANSACTION")) {
        connection.beginTransaction((error) => error ? reject(error) : resolve([]), options.transaction.name, connection.lib.ISOLATION_LEVEL[options.isolationLevel]);
        return;
      }
      if (sql.startsWith("COMMIT TRANSACTION")) {
        connection.commitTransaction((error) => error ? reject(error) : resolve([]));
        return;
      }
      if (sql.startsWith("ROLLBACK TRANSACTION")) {
        connection.rollbackTransaction((error) => error ? reject(error) : resolve([]), options.transaction.name);
        return;
      }
      if (sql.startsWith("SAVE TRANSACTION")) {
        connection.saveTransaction((error) => error ? reject(error) : resolve([]), options.transaction.name);
        return;
      }
      const rows2 = [];
      const request = new connection.lib.Request(sql, (err, rowCount2) => err ? reject(err) : resolve([rows2, rowCount2]));
      if (parameters) {
        if (Array.isArray(parameters)) {
          for (let i = 0; i < parameters.length; i++) {
            const paramType = this.getSQLTypeFromJsType(parameters[i], connection.lib.TYPES);
            request.addParameter(String(i + 1), paramType.type, paramType.value, paramType.typeOptions);
          }
        } else {
          _.forOwn(parameters, (parameter, parameterName) => {
            const paramType = this.getSQLTypeFromJsType(parameter, connection.lib.TYPES);
            request.addParameter(parameterName, paramType.type, paramType.value, paramType.typeOptions);
          });
        }
      }
      request.on("row", (columns) => {
        rows2.push(columns);
      });
      connection.execSql(request);
    });
    let rows;
    let rowCount;
    try {
      [rows, rowCount] = await query;
    } catch (error) {
      error.sql = sql;
      error.parameters = parameters;
      throw this.formatError(error, errStack);
    }
    complete();
    if (Array.isArray(rows)) {
      rows = rows.map((columns) => {
        const row = {};
        for (const column of columns) {
          const typeid = column.metadata.type.id;
          const parse = parserStore.get(typeid);
          let value = column.value;
          if (value !== null & Boolean(parse)) {
            value = parse(value);
          }
          row[column.metadata.colName] = value;
        }
        return row;
      });
    }
    return this.formatResults(rows, rowCount);
  }
  run(sql, parameters) {
    const errForStack = new Error();
    return this.connection.queue.enqueue(() => this._run(this.connection, sql, parameters, errForStack.stack));
  }
  formatResults(data, rowCount) {
    if (this.isInsertQuery(data)) {
      this.handleInsertQuery(data);
      return [this.instance || data, rowCount];
    }
    if (this.isShowTablesQuery()) {
      return this.handleShowTablesQuery(data);
    }
    if (this.isDescribeQuery()) {
      const result = {};
      for (const _result of data) {
        if (_result.Default) {
          _result.Default = _result.Default.replace("('", "").replace("')", "").replace(/'/g, "");
        }
        result[_result.Name] = {
          type: _result.Type.toUpperCase(),
          allowNull: _result.IsNull === "YES",
          defaultValue: _result.Default,
          primaryKey: _result.Constraint === "PRIMARY KEY",
          autoIncrement: _result.IsIdentity === 1,
          comment: _result.Comment
        };
        if (result[_result.Name].type.includes("CHAR") && _result.Length) {
          if (_result.Length === -1) {
            result[_result.Name].type += "(MAX)";
          } else {
            result[_result.Name].type += `(${_result.Length})`;
          }
        }
      }
      return result;
    }
    if (this.isSelectQuery()) {
      return this.handleSelectQuery(data);
    }
    if (this.isShowIndexesQuery()) {
      return this.handleShowIndexesQuery(data);
    }
    if (this.isCallQuery()) {
      return data[0];
    }
    if (this.isBulkUpdateQuery()) {
      if (this.options.returning) {
        return this.handleSelectQuery(data);
      }
      return rowCount;
    }
    if (this.isBulkDeleteQuery()) {
      return data[0] ? data[0].AFFECTEDROWS : 0;
    }
    if (this.isVersionQuery()) {
      return data[0].version;
    }
    if (this.isForeignKeysQuery()) {
      return data;
    }
    if (this.isUpsertQuery()) {
      if (data && data.length === 0) {
        return [this.instance || data, false];
      }
      this.handleInsertQuery(data);
      return [this.instance || data, data[0].$action === "INSERT"];
    }
    if (this.isUpdateQuery()) {
      return [this.instance || data, rowCount];
    }
    if (this.isShowConstraintsQuery()) {
      return this.handleShowConstraintsQuery(data);
    }
    if (this.isRawQuery()) {
      return [data, rowCount];
    }
    return data;
  }
  handleShowTablesQuery(results) {
    return results.map((resultSet) => {
      return {
        tableName: resultSet.TABLE_NAME,
        schema: resultSet.TABLE_SCHEMA
      };
    });
  }
  handleShowConstraintsQuery(data) {
    return data.slice(1).map((result) => {
      const constraint = {};
      for (const key in result) {
        constraint[_.camelCase(key)] = result[key];
      }
      return constraint;
    });
  }
  formatError(err, errStack) {
    let match;
    match = err.message.match(/Violation of (?:UNIQUE|PRIMARY) KEY constraint '([^']*)'. Cannot insert duplicate key in object '.*'.(:? The duplicate key value is \((.*)\).)?/);
    match = match || err.message.match(/Cannot insert duplicate key row in object .* with unique index '(.*)'/);
    if (match && match.length > 1) {
      let fields = {};
      const uniqueKey = this.model && this.model.uniqueKeys[match[1]];
      let message = "Validation error";
      if (uniqueKey && Boolean(uniqueKey.msg)) {
        message = uniqueKey.msg;
      }
      if (match[3]) {
        const values = match[3].split(",").map((part) => part.trim());
        if (uniqueKey) {
          fields = _.zipObject(uniqueKey.fields, values);
        } else {
          fields[match[1]] = match[3];
        }
      }
      const errors = [];
      _.forOwn(fields, (value, field) => {
        errors.push(new sequelizeErrors.ValidationErrorItem(this.getUniqueConstraintErrorMessage(field), "unique violation", field, value, this.instance, "not_unique"));
      });
      return new sequelizeErrors.UniqueConstraintError({ message, errors, cause: err, fields, stack: errStack });
    }
    match = err.message.match(/Failed on step '(.*)'.Could not create constraint. See previous errors./) || err.message.match(/The DELETE statement conflicted with the REFERENCE constraint "(.*)". The conflict occurred in database "(.*)", table "(.*)", column '(.*)'./) || err.message.match(/The (?:INSERT|MERGE|UPDATE) statement conflicted with the FOREIGN KEY constraint "(.*)". The conflict occurred in database "(.*)", table "(.*)", column '(.*)'./);
    if (match && match.length > 0) {
      return new sequelizeErrors.ForeignKeyConstraintError({
        fields: null,
        index: match[1],
        cause: err,
        stack: errStack
      });
    }
    match = err.message.match(/Could not drop constraint. See previous errors./);
    if (match && match.length > 0) {
      let constraint = err.sql.match(/(?:constraint|index) \[(.+?)]/i);
      constraint = constraint ? constraint[1] : void 0;
      let table = err.sql.match(/table \[(.+?)]/i);
      table = table ? table[1] : void 0;
      return new sequelizeErrors.UnknownConstraintError({
        message: match[1],
        constraint,
        table,
        cause: err,
        stack: errStack
      });
    }
    return new sequelizeErrors.DatabaseError(err, { stack: errStack });
  }
  isShowOrDescribeQuery() {
    let result = false;
    result = result || this.sql.toLowerCase().startsWith("select c.column_name as 'name', c.data_type as 'type', c.is_nullable as 'isnull'");
    result = result || this.sql.toLowerCase().startsWith("select tablename = t.name, name = ind.name,");
    result = result || this.sql.toLowerCase().startsWith("exec sys.sp_helpindex @objname");
    return result;
  }
  isShowIndexesQuery() {
    return this.sql.toLowerCase().startsWith("exec sys.sp_helpindex @objname");
  }
  handleShowIndexesQuery(data) {
    data = data.reduce((acc, item) => {
      if (!(item.index_name in acc)) {
        acc[item.index_name] = item;
        item.fields = [];
      }
      for (const column of item.index_keys.split(",")) {
        let columnName = column.trim();
        if (columnName.includes("(-)")) {
          columnName = columnName.replace("(-)", "");
        }
        acc[item.index_name].fields.push({
          attribute: columnName,
          length: void 0,
          order: column.includes("(-)") ? "DESC" : "ASC",
          collate: void 0
        });
      }
      delete item.index_keys;
      return acc;
    }, {});
    return _.map(data, (item) => ({
      primary: item.index_name.toLowerCase().startsWith("pk"),
      fields: item.fields,
      name: item.index_name,
      tableName: void 0,
      unique: item.index_description.toLowerCase().includes("unique"),
      type: void 0
    }));
  }
  handleInsertQuery(results, metaData) {
    if (this.instance) {
      const autoIncrementAttribute = this.model.autoIncrementAttribute;
      let id = null;
      let autoIncrementAttributeAlias = null;
      if (Object.prototype.hasOwnProperty.call(this.model.rawAttributes, autoIncrementAttribute) && this.model.rawAttributes[autoIncrementAttribute].field !== void 0) {
        autoIncrementAttributeAlias = this.model.rawAttributes[autoIncrementAttribute].field;
      }
      id = id || results && results[0][this.getInsertIdField()];
      id = id || metaData && metaData[this.getInsertIdField()];
      id = id || results && results[0][autoIncrementAttribute];
      id = id || autoIncrementAttributeAlias && results && results[0][autoIncrementAttributeAlias];
      this.instance[autoIncrementAttribute] = id;
      if (this.instance.dataValues) {
        for (const key in results[0]) {
          if (Object.prototype.hasOwnProperty.call(results[0], key)) {
            const record = results[0][key];
            const attr = _.find(this.model.rawAttributes, (attribute) => attribute.fieldName === key || attribute.field === key);
            this.instance.dataValues[attr && attr.fieldName || key] = record;
          }
        }
      }
    }
  }
}
//# sourceMappingURL=query.js.map
