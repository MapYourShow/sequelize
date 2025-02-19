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
  PostgresQueryInterface: () => PostgresQueryInterface
});
module.exports = __toCommonJS(query_interface_exports);
const DataTypes = require("../../data-types");
const { QueryTypes } = require("../../query-types");
const { QueryInterface } = require("../abstract/query-interface");
const Utils = require("../../utils");
class PostgresQueryInterface extends QueryInterface {
  async ensureEnums(tableName, attributes, options, model) {
    const keys = Object.keys(attributes);
    const keyLen = keys.length;
    let sql = "";
    let promises = [];
    let i = 0;
    for (i = 0; i < keyLen; i++) {
      const attribute = attributes[keys[i]];
      const type = attribute.type;
      if (type instanceof DataTypes.ENUM || type instanceof DataTypes.ARRAY && type.type instanceof DataTypes.ENUM) {
        sql = this.queryGenerator.pgListEnums(tableName, attribute.field || keys[i], options);
        promises.push(this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { plain: true, raw: true, type: QueryTypes.SELECT })));
      }
    }
    const results = await Promise.all(promises);
    promises = [];
    let enumIdx = 0;
    const addEnumValue = (field, value, relativeValue, position = "before", spliceStart = promises.length) => {
      const valueOptions = __spreadValues({}, options);
      valueOptions.before = null;
      valueOptions.after = null;
      switch (position) {
        case "after":
          valueOptions.after = relativeValue;
          break;
        case "before":
        default:
          valueOptions.before = relativeValue;
          break;
      }
      promises.splice(spliceStart, 0, () => {
        return this.sequelize.queryRaw(this.queryGenerator.pgEnumAdd(tableName, field, value, valueOptions), valueOptions);
      });
    };
    for (i = 0; i < keyLen; i++) {
      const attribute = attributes[keys[i]];
      const type = attribute.type;
      const enumType = type.type || type;
      const field = attribute.field || keys[i];
      if (type instanceof DataTypes.ENUM || type instanceof DataTypes.ARRAY && enumType instanceof DataTypes.ENUM) {
        if (!results[enumIdx]) {
          promises.push(() => {
            return this.sequelize.queryRaw(this.queryGenerator.pgEnum(tableName, field, enumType, options), __spreadProps(__spreadValues({}, options), { raw: true }));
          });
        } else if (Boolean(results[enumIdx]) && Boolean(model)) {
          const enumVals = this.queryGenerator.fromArray(results[enumIdx].enum_value);
          const vals = enumType.values;
          let lastOldEnumValue;
          let rightestPosition = -1;
          for (let oldIndex = 0; oldIndex < enumVals.length; oldIndex++) {
            const enumVal = enumVals[oldIndex];
            const newIdx = vals.indexOf(enumVal);
            lastOldEnumValue = enumVal;
            if (newIdx === -1) {
              continue;
            }
            const newValuesBefore = vals.slice(0, newIdx);
            const promisesLength = promises.length;
            for (let reverseIdx = newValuesBefore.length - 1; reverseIdx >= 0; reverseIdx--) {
              if (~enumVals.indexOf(newValuesBefore[reverseIdx])) {
                break;
              }
              addEnumValue(field, newValuesBefore[reverseIdx], lastOldEnumValue, "before", promisesLength);
            }
            if (newIdx > rightestPosition) {
              rightestPosition = newIdx;
            }
          }
          if (lastOldEnumValue && rightestPosition < vals.length - 1) {
            const remainingEnumValues = vals.slice(rightestPosition + 1);
            for (let reverseIdx = remainingEnumValues.length - 1; reverseIdx >= 0; reverseIdx--) {
              addEnumValue(field, remainingEnumValues[reverseIdx], lastOldEnumValue, "after");
            }
          }
          enumIdx++;
        }
      }
    }
    const result = await promises.reduce(async (promise, asyncFunction) => await asyncFunction(await promise), Promise.resolve());
    if (promises.length > 0) {
      await this.sequelize.dialect.connectionManager._refreshDynamicOIDs();
    }
    return result;
  }
  async getForeignKeyReferencesForTable(table, options) {
    const queryOptions = __spreadProps(__spreadValues({}, options), {
      type: QueryTypes.FOREIGNKEYS
    });
    const query = this.queryGenerator.getForeignKeyReferencesQuery(table.tableName || table, this.sequelize.config.database);
    const result = await this.sequelize.queryRaw(query, queryOptions);
    return result.map(Utils.camelizeObjectKeys);
  }
  async dropEnum(enumName, options) {
    options = options || {};
    return this.sequelize.queryRaw(this.queryGenerator.pgEnumDrop(null, null, this.queryGenerator.pgEscapeAndQuote(enumName)), __spreadProps(__spreadValues({}, options), { raw: true }));
  }
  async dropAllEnums(options) {
    options = options || {};
    const enums = await this.pgListEnums(null, options);
    return await Promise.all(enums.map((result) => this.sequelize.queryRaw(this.queryGenerator.pgEnumDrop(null, null, this.queryGenerator.pgEscapeAndQuote(result.enum_name)), __spreadProps(__spreadValues({}, options), { raw: true }))));
  }
  async pgListEnums(tableName, options) {
    options = options || {};
    const sql = this.queryGenerator.pgListEnums(tableName);
    return this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { plain: false, raw: true, type: QueryTypes.SELECT }));
  }
  async dropTable(tableName, options) {
    await super.dropTable(tableName, options);
    const promises = [];
    const instanceTable = this.sequelize.modelManager.getModel(tableName, { attribute: "tableName" });
    if (!instanceTable) {
      return;
    }
    const getTableName = (!options || !options.schema || options.schema === "public" ? "" : `${options.schema}_`) + tableName;
    const keys = Object.keys(instanceTable.rawAttributes);
    const keyLen = keys.length;
    for (let i = 0; i < keyLen; i++) {
      if (instanceTable.rawAttributes[keys[i]].type instanceof DataTypes.ENUM) {
        const sql = this.queryGenerator.pgEnumDrop(getTableName, keys[i]);
        options.supportsSearchPath = false;
        promises.push(this.sequelize.queryRaw(sql, __spreadProps(__spreadValues({}, options), { raw: true })));
      }
    }
    await Promise.all(promises);
  }
}
//# sourceMappingURL=query-interface.js.map
