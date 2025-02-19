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
  Db2Query: () => Db2Query
});
module.exports = __toCommonJS(query_exports);
var import_node_assert = __toESM(require("node:assert"));
var import_node_util = __toESM(require("node:util"));
const { AbstractQuery } = require("../abstract/query");
const sequelizeErrors = require("../../errors");
const parserStore = require("../parserStore")("db2");
const _ = require("lodash");
const { logger } = require("../../utils/logger");
const dayjs = require("dayjs");
const debug = logger.debugContext("sql:db2");
class Db2Query extends AbstractQuery {
  getInsertIdField() {
    return "id";
  }
  getSQLTypeFromJsType(value) {
    if (Buffer.isBuffer(value)) {
      return { ParamType: "INPUT", DataType: "BLOB", Data: value };
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  }
  async _run(connection, sql, parameters) {
    (0, import_node_assert.default)(typeof sql === "string", `sql parameter must be a string`);
    this.sql = sql;
    const benchmark = this.sequelize.options.benchmark || this.options.benchmark;
    let queryBegin;
    if (benchmark) {
      queryBegin = Date.now();
    } else {
      this.sequelize.log(`Executing (${this.connection.uuid || "default"}): ${this.sql}`, this.options);
    }
    const errStack = new Error().stack;
    return new Promise((resolve, reject) => {
      if (_.startsWith(this.sql, "BEGIN TRANSACTION")) {
        connection.beginTransaction((err) => {
          if (err) {
            reject(this.formatError(err, errStack));
          } else {
            resolve(this.formatResults());
          }
        });
      } else if (_.startsWith(this.sql, "COMMIT TRANSACTION")) {
        connection.commitTransaction((err) => {
          if (err) {
            reject(this.formatError(err, errStack));
          } else {
            resolve(this.formatResults());
          }
        });
      } else if (_.startsWith(this.sql, "ROLLBACK TRANSACTION")) {
        connection.rollbackTransaction((err) => {
          if (err) {
            reject(this.formatError(err, errStack));
          } else {
            resolve(this.formatResults());
          }
        });
      } else if (_.startsWith(this.sql, "SAVE TRANSACTION")) {
        connection.commitTransaction((err) => {
          if (err) {
            reject(this.formatError(err, errStack));
          } else {
            connection.beginTransaction((err2) => {
              if (err2) {
                reject(this.formatError(err2, errStack));
              } else {
                resolve(this.formatResults());
              }
            });
          }
        }, this.options.transaction.name);
      } else {
        const params = [];
        if (parameters) {
          _.forOwn(parameters, (value, key) => {
            const param = this.getSQLTypeFromJsType(value, key);
            params.push(param);
          });
        }
        const SQL = this.sql.toUpperCase();
        let newSql = this.sql;
        if ((this.isSelectQuery() || _.startsWith(SQL, "SELECT ")) && !SQL.includes(" FROM ", 8)) {
          if (this.sql.charAt(this.sql.length - 1) === ";") {
            newSql = this.sql.slice(0, -1);
          }
          newSql += " FROM SYSIBM.SYSDUMMY1;";
        }
        connection.prepare(newSql, (err, stmt) => {
          if (err) {
            reject(this.formatError(err, errStack));
          }
          stmt.execute(params, (err2, result, outparams) => {
            debug(`executed(${this.connection.uuid || "default"}):${newSql} ${parameters ? import_node_util.default.inspect(parameters, { compact: true, breakLength: Infinity }) : ""}`);
            if (benchmark) {
              this.sequelize.log(`Executed (${this.connection.uuid || "default"}): ${newSql} ${parameters ? import_node_util.default.inspect(parameters, { compact: true, breakLength: Infinity }) : ""}`, Date.now() - queryBegin, this.options);
            }
            if (err2 && err2.message) {
              err2 = this.filterSQLError(err2, this.sql, connection);
              if (err2 === null) {
                stmt.closeSync();
                resolve(this.formatResults([], 0));
              }
            }
            if (err2) {
              err2.sql = sql;
              stmt.closeSync();
              reject(this.formatError(err2, errStack, connection, parameters));
            } else {
              let data = [];
              let metadata = [];
              let affectedRows = 0;
              if (typeof result === "object") {
                if (_.startsWith(this.sql, "DELETE FROM ")) {
                  affectedRows = result.getAffectedRowsSync();
                } else {
                  data = result.fetchAllSync();
                  metadata = result.getColumnMetadataSync();
                }
                result.closeSync();
              }
              stmt.closeSync();
              const datalen = data.length;
              if (datalen > 0) {
                const coltypes = {};
                for (const metadatum of metadata) {
                  coltypes[metadatum.SQL_DESC_NAME] = metadatum.SQL_DESC_TYPE_NAME;
                }
                for (let i = 0; i < datalen; i++) {
                  for (const column in data[i]) {
                    const parse = parserStore.get(coltypes[column]);
                    const value = data[i][column];
                    if (value !== null) {
                      if (parse) {
                        data[i][column] = parse(value);
                      } else if (coltypes[column] === "TIMESTAMP") {
                        data[i][column] = new Date(dayjs.utc(value));
                      } else if (coltypes[column] === "BLOB") {
                        data[i][column] = new Buffer.from(value);
                      } else if (coltypes[column].indexOf("FOR BIT DATA") > 0) {
                        data[i][column] = new Buffer.from(value, "hex");
                      }
                    }
                  }
                }
                if (outparams && outparams.length > 0) {
                  data.unshift(outparams);
                }
                resolve(this.formatResults(data, datalen, metadata, connection));
              } else {
                resolve(this.formatResults(data, affectedRows));
              }
            }
          });
        });
      }
    });
  }
  async run(sql, parameters) {
    return await this._run(this.connection, sql, parameters);
  }
  filterSQLError(err, sql, connection) {
    if (err.message.search("SQL0204N") !== -1 && _.startsWith(sql, "DROP ")) {
      err = null;
    } else if (err.message.search("SQL0443N") !== -1) {
      if (this.isDropSchemaQuery()) {
        connection.querySync("DROP TABLE ERRORSCHEMA.ERRORTABLE;");
        connection.querySync(this.sql);
      }
      err = null;
    } else if (err.message.search("SQL0601N") !== -1) {
      const match = err.message.match(/SQL0601N {2}The name of the object to be created is identical to the existing name "(.*)" of type "(.*)"./);
      if (match && match.length > 1 && match[2] === "TABLE") {
        let table;
        const mtarray = match[1].split(".");
        if (mtarray[1]) {
          table = `"${mtarray[0]}"."${mtarray[1]}"`;
        } else {
          table = `"${mtarray[0]}"`;
        }
        if (connection.dropTable !== false) {
          connection.querySync(`DROP TABLE ${table}`);
          err = connection.querySync(sql);
        } else {
          err = null;
        }
      } else {
        err = null;
      }
    } else if (err.message.search("SQL0911N") !== -1) {
      if (err.message.search('Reason code "2"') !== -1) {
        err = null;
      }
    } else if (err.message.search("SQL0605W") !== -1) {
      err = null;
    } else if (err.message.search("SQL0668N") !== -1 && _.startsWith(sql, "ALTER TABLE ")) {
      connection.querySync(`CALL SYSPROC.ADMIN_CMD('REORG TABLE ${sql.slice(12).split(" ")[0]}')`);
      err = connection.querySync(sql);
    }
    if (err && err.length === 0) {
      err = null;
    }
    return err;
  }
  formatResults(data, rowCount, metadata, conn) {
    let result = this.instance;
    if (this.isInsertQuery(data, metadata)) {
      this.handleInsertQuery(data, metadata);
      if (!this.instance) {
        if (this.options.plain) {
          const record = data[0];
          result = record[Object.keys(record)[0]];
        } else {
          result = data;
        }
      }
    }
    if (this.isShowTablesQuery()) {
      result = data;
    } else if (this.isDescribeQuery()) {
      result = {};
      for (const _result of data) {
        if (_result.Default) {
          _result.Default = _result.Default.replace("('", "").replace("')", "").replace(/'/g, "");
        }
        result[_result.Name] = {
          type: _result.Type.toUpperCase(),
          allowNull: _result.IsNull === "Y",
          defaultValue: _result.Default,
          primaryKey: _result.KeySeq > 0,
          autoIncrement: _result.IsIdentity === "Y",
          comment: _result.Comment
        };
      }
    } else if (this.isShowIndexesQuery()) {
      result = this.handleShowIndexesQuery(data);
    } else if (this.isSelectQuery()) {
      result = this.handleSelectQuery(data);
    } else if (this.isUpsertQuery()) {
      result = data;
    } else if (this.isDropSchemaQuery()) {
      result = data[0];
      if (conn) {
        const query = "DROP TABLE ERRORSCHEMA.ERRORTABLE";
        conn.querySync(query);
      }
    } else if (this.isCallQuery()) {
      result = data;
    } else if (this.isBulkUpdateQuery()) {
      result = data.length;
    } else if (this.isBulkDeleteQuery()) {
      result = rowCount;
    } else if (this.isVersionQuery()) {
      result = data[0].VERSION;
    } else if (this.isForeignKeysQuery()) {
      result = data;
    } else if (this.isInsertQuery() || this.isUpdateQuery()) {
      result = [result, rowCount];
    } else if (this.isShowConstraintsQuery()) {
      result = this.handleShowConstraintsQuery(data);
    } else if (this.isRawQuery()) {
      result = [data, metadata];
    } else {
      result = data;
    }
    return result;
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
    return _.remove(data, (constraint) => {
      return !_.startsWith(constraint.constraintName, "SQL");
    });
  }
  formatError(err, errStack, conn, parameters) {
    let match;
    if (!(err && err.message)) {
      err.message = "No error message found.";
    }
    match = err.message.match(/SQL0803N {2}One or more values in the INSERT statement, UPDATE statement, or foreign key update caused by a DELETE statement are not valid because the primary key, unique constraint or unique index identified by "(\d)+" constrains table "(.*)\.(.*)" from having duplicate values for the index key./);
    if (match && match.length > 0) {
      let uniqueIndexName = "";
      let uniqueKey = "";
      const fields = {};
      let message = err.message;
      const query = `SELECT INDNAME FROM SYSCAT.INDEXES  WHERE IID = ${match[1]} AND TABSCHEMA = '${match[2]}' AND TABNAME = '${match[3]}'`;
      if (Boolean(conn) && match.length > 3) {
        uniqueIndexName = conn.querySync(query);
        uniqueIndexName = uniqueIndexName[0].INDNAME;
      }
      if (this.model && Boolean(uniqueIndexName)) {
        uniqueKey = this.model.uniqueKeys[uniqueIndexName];
      }
      if (!uniqueKey && this.options.fields) {
        uniqueKey = this.options.fields[match[1] - 1];
      }
      if (uniqueKey) {
        if (this.options.where && this.options.where[uniqueKey.column] !== void 0) {
          fields[uniqueKey.column] = this.options.where[uniqueKey.column];
        } else if (this.options.instance && this.options.instance.dataValues && this.options.instance.dataValues[uniqueKey.column]) {
          fields[uniqueKey.column] = this.options.instance.dataValues[uniqueKey.column];
        } else if (parameters) {
          fields[uniqueKey.column] = parameters["0"];
        }
      }
      if (uniqueKey && Boolean(uniqueKey.msg)) {
        message = uniqueKey.msg;
      }
      const errors = [];
      _.forOwn(fields, (value, field) => {
        errors.push(new sequelizeErrors.ValidationErrorItem(this.getUniqueConstraintErrorMessage(field), "unique violation", field, value, this.instance, "not_unique"));
      });
      return new sequelizeErrors.UniqueConstraintError({ message, errors, cause: err, fields, stack: errStack });
    }
    match = err.message.match(/SQL0532N {2}A parent row cannot be deleted because the relationship "(.*)" restricts the deletion/) || err.message.match(/SQL0530N/) || err.message.match(/SQL0531N/);
    if (match && match.length > 0) {
      return new sequelizeErrors.ForeignKeyConstraintError({
        fields: null,
        index: match[1],
        cause: err,
        stack: errStack
      });
    }
    match = err.message.match(/SQL0204N {2}"(.*)" is an undefined name./);
    if (match && match.length > 1) {
      const constraint = match[1];
      let table = err.sql.match(/table "(.+?)"/i);
      table = table ? table[1] : void 0;
      return new sequelizeErrors.UnknownConstraintError({
        message: match[0],
        constraint,
        table,
        cause: err,
        stack: errStack
      });
    }
    return new sequelizeErrors.DatabaseError(err, { stack: errStack });
  }
  isDropSchemaQuery() {
    let result = false;
    if (_.startsWith(this.sql, "CALL SYSPROC.ADMIN_DROP_SCHEMA")) {
      result = true;
    }
    return result;
  }
  isShowOrDescribeQuery() {
    let result = false;
    result = result || this.sql.toLowerCase().startsWith("select c.column_name as 'name', c.data_type as 'type', c.is_nullable as 'isnull'");
    result = result || this.sql.toLowerCase().startsWith("select tablename = t.name, name = ind.name,");
    result = result || this.sql.toLowerCase().startsWith("exec sys.sp_helpindex @objname");
    return result;
  }
  isShowIndexesQuery() {
    let result = false;
    result = result || this.sql.toLowerCase().startsWith("exec sys.sp_helpindex @objname");
    result = result || this.sql.startsWith('SELECT NAME AS "name", TBNAME AS "tableName", UNIQUERULE AS "keyType", COLNAMES, INDEXTYPE AS "type" FROM SYSIBM.SYSINDEXES');
    return result;
  }
  handleShowIndexesQuery(data) {
    let currItem;
    const result = [];
    for (const item of data) {
      if (!currItem || currItem.name !== item.Key_name) {
        currItem = {
          primary: item.keyType === "P",
          fields: [],
          name: item.name,
          tableName: item.tableName,
          unique: item.keyType === "U",
          type: item.type
        };
        _.forEach(item.COLNAMES.replace(/\+|-/g, (x) => {
          return ` ${x}`;
        }).split(" "), (column) => {
          let columnName = column.trim();
          if (columnName) {
            columnName = columnName.replace(/\+|-/, "");
            currItem.fields.push({
              attribute: columnName,
              length: void 0,
              order: !column.includes("-") ? "ASC" : "DESC",
              collate: void 0
            });
          }
        });
        result.push(currItem);
      }
    }
    return result;
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
    }
  }
}
//# sourceMappingURL=query.js.map
