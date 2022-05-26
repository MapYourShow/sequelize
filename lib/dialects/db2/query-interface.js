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
  Db2QueryInterface: () => Db2QueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const Utils = require("../../utils");
const { Op } = require("../../operators");
const { QueryInterface } = require("../abstract/query-interface");
const { QueryTypes } = require("../../query-types");
class Db2QueryInterface extends QueryInterface {
  async getForeignKeyReferencesForTable(tableName, options) {
    const queryOptions = __spreadProps(__spreadValues({}, options), {
      type: QueryTypes.FOREIGNKEYS
    });
    const query = this.queryGenerator.getForeignKeysQuery(tableName, this.sequelize.config.username.toUpperCase());
    return this.sequelize.queryRaw(query, queryOptions);
  }
  async upsert(tableName, insertValues, updateValues, where, options) {
    if (options.bind) {
      (0, import_sql.assertNoReservedBind)(options.bind);
    }
    options = __spreadValues({}, options);
    const model = options.model;
    const wheres = [];
    const attributes = Object.keys(insertValues);
    let indexFields;
    options = _.clone(options);
    if (!Utils.isWhereEmpty(where)) {
      wheres.push(where);
    }
    const indexes = _.map(model.uniqueKeys, (value) => {
      return value.fields;
    });
    for (const value of model._indexes) {
      if (value.unique) {
        indexFields = value.fields.map((field) => {
          if (_.isPlainObject(field)) {
            return field.attribute;
          }
          return field;
        });
        indexes.push(indexFields);
      }
    }
    for (const index of indexes) {
      if (_.intersection(attributes, index).length === index.length) {
        where = {};
        for (const field of index) {
          where[field] = insertValues[field];
        }
        wheres.push(where);
      }
    }
    where = { [Op.or]: wheres };
    options.type = QueryTypes.UPSERT;
    options.raw = true;
    const sql = this.queryGenerator.upsertQuery(tableName, insertValues, updateValues, where, model, options);
    delete options.replacements;
    const result = await this.sequelize.queryRaw(sql, options);
    return [result, void 0];
  }
  async createTable(tableName, attributes, options, model) {
    let sql = "";
    options = __spreadValues({}, options);
    if (options && options.uniqueKeys) {
      _.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === void 0) {
          uniqueKey.customIndex = true;
        }
      });
    }
    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }
    attributes = _.mapValues(attributes, (attribute) => this.sequelize.normalizeAttribute(attribute));
    if (options.indexes) {
      for (const fields of options.indexes) {
        const fieldArr = fields.fields;
        if (fieldArr.length === 1) {
          for (const field of fieldArr) {
            for (const property in attributes) {
              if (field === attributes[property].field) {
                attributes[property].unique = true;
              }
            }
          }
        }
      }
    }
    if (options.alter && options.indexes) {
      for (const fields of options.indexes) {
        const fieldArr = fields.fields;
        if (fieldArr.length === 1) {
          for (const field of fieldArr) {
            for (const property in attributes) {
              if (field === attributes[property].field && attributes[property].unique) {
                attributes[property].unique = false;
              }
            }
          }
        }
      }
    }
    if (!tableName.schema && (options.schema || Boolean(model) && model._schema)) {
      tableName = this.queryGenerator.addSchema({
        tableName,
        _schema: Boolean(model) && model._schema || options.schema
      });
    }
    attributes = this.queryGenerator.attributesToSQL(attributes, { table: tableName, context: "createTable" });
    sql = this.queryGenerator.createTableQuery(tableName, attributes, options);
    return await this.sequelize.queryRaw(sql, options);
  }
}
//# sourceMappingURL=query-interface.js.map
