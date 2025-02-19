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
var query_interface_exports = {};
__export(query_interface_exports, {
  MySqlQueryInterface: () => MySqlQueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
var import_sql = require("../../utils/sql");
const sequelizeErrors = require("../../errors");
const { QueryInterface } = require("../abstract/query-interface");
const { QueryTypes } = require("../../query-types");
class MySqlQueryInterface extends QueryInterface {
  async removeColumn(tableName, columnName, options) {
    options = options || {};
    const [results] = await this.sequelize.queryRaw(this.queryGenerator.getForeignKeyQuery(tableName.tableName ? tableName : {
      tableName,
      schema: this.sequelize.config.database
    }, columnName), __spreadValues({ raw: true }, options));
    if (results.length > 0 && results[0].constraint_name !== "PRIMARY") {
      await Promise.all(results.map((constraint) => this.sequelize.queryRaw(this.queryGenerator.dropForeignKeyQuery(tableName, constraint.constraint_name), __spreadValues({ raw: true }, options))));
    }
    return await this.sequelize.queryRaw(this.queryGenerator.removeColumnQuery(tableName, columnName), __spreadValues({ raw: true }, options));
  }
  async upsert(tableName, insertValues, updateValues, where, options) {
    if (options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = __spreadValues({}, options);
    options.type = QueryTypes.UPSERT;
    options.updateOnDuplicate = Object.keys(updateValues);
    options.upsertKeys = Object.values(options.model.primaryKeys).map((item) => item.field);
    const model = options.model;
    const { query, bind } = this.queryGenerator.insertQuery(tableName, insertValues, model.rawAttributes, options);
    delete options.replacements;
    options.bind = (0, import_sql.combineBinds)(options.bind, bind);
    return await this.sequelize.queryRaw(query, options);
  }
  async removeConstraint(tableName, constraintName, options) {
    const sql = this.queryGenerator.showConstraintsQuery(tableName.tableName ? tableName : {
      tableName,
      schema: this.sequelize.config.database
    }, constraintName);
    const constraints = await this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), {
      type: this.sequelize.QueryTypes.SHOWCONSTRAINTS
    }));
    const constraint = constraints[0];
    let query;
    if (!constraint || !constraint.constraintType) {
      throw new sequelizeErrors.UnknownConstraintError({
        message: `Constraint ${constraintName} on table ${tableName} does not exist`,
        constraint: constraintName,
        table: tableName
      });
    }
    if (constraint.constraintType === "FOREIGN KEY") {
      query = this.queryGenerator.dropForeignKeyQuery(tableName, constraintName);
    } else {
      query = this.queryGenerator.removeIndexQuery(constraint.tableName, constraint.constraintName);
    }
    return await this.sequelize.queryRaw(query, options);
  }
}
//# sourceMappingURL=query-interface.js.map
