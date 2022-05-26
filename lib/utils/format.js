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
var format_exports = {};
__export(format_exports, {
  combineTableNames: () => combineTableNames,
  generateEnumName: () => generateEnumName,
  getColumnName: () => getColumnName,
  getComplexKeys: () => getComplexKeys,
  getOperators: () => getOperators,
  mapFinderOptions: () => mapFinderOptions,
  mapOptionFieldNames: () => mapOptionFieldNames,
  mapValueFieldNames: () => mapValueFieldNames,
  mapWhereFieldNames: () => mapWhereFieldNames,
  removeNullishValuesFromHash: () => removeNullishValuesFromHash
});
module.exports = __toCommonJS(format_exports);
var import_assert = __toESM(require("assert"));
var import_forIn = __toESM(require("lodash/forIn"));
var import_isPlainObject = __toESM(require("lodash/isPlainObject"));
var import_operators = require("../operators");
const DataTypes = require("../data-types");
const operatorsSet = new Set(Object.values(import_operators.Op));
function mapFinderOptions(options, Model) {
  if (Array.isArray(options.attributes)) {
    options.attributes = Model._injectDependentVirtualAttributes(options.attributes);
    options.attributes = options.attributes.filter((v) => !Model._virtualAttributes.has(v));
  }
  mapOptionFieldNames(options, Model);
  return options;
}
function mapOptionFieldNames(options, Model) {
  const out = options;
  if (Array.isArray(options.attributes)) {
    out.attributes = options.attributes.map((attributeName) => {
      var _a;
      if (typeof attributeName !== "string") {
        return attributeName;
      }
      const columnName = (_a = Model.rawAttributes[attributeName]) == null ? void 0 : _a.field;
      if (columnName && columnName !== attributeName) {
        return [columnName, attributeName];
      }
      return attributeName;
    });
  }
  if (options.where != null && (0, import_isPlainObject.default)(options.where)) {
    out.where = mapWhereFieldNames(options.where, Model);
  }
  return out;
}
function mapWhereFieldNames(where, Model) {
  if (!where) {
    return where;
  }
  const newWhere = /* @__PURE__ */ Object.create(null);
  for (const attributeNameOrOperator of getComplexKeys(where)) {
    const rawAttribute = Model.rawAttributes[attributeNameOrOperator];
    const columnNameOrOperator = (rawAttribute == null ? void 0 : rawAttribute.field) ?? attributeNameOrOperator;
    if ((0, import_isPlainObject.default)(where[attributeNameOrOperator]) && !(rawAttribute && (rawAttribute.type instanceof DataTypes.HSTORE || rawAttribute.type instanceof DataTypes.JSON))) {
      newWhere[columnNameOrOperator] = mapOptionFieldNames({
        where: where[attributeNameOrOperator]
      }, Model).where;
      continue;
    }
    if (Array.isArray(where[attributeNameOrOperator])) {
      newWhere[columnNameOrOperator] = [...where[attributeNameOrOperator]];
      for (const [index, wherePart] of where[attributeNameOrOperator].entries()) {
        if ((0, import_isPlainObject.default)(wherePart)) {
          newWhere[columnNameOrOperator][index] = mapWhereFieldNames(wherePart, Model);
        }
      }
      continue;
    }
    newWhere[columnNameOrOperator] = where[attributeNameOrOperator];
  }
  return newWhere;
}
function getComplexKeys(obj) {
  return [
    ...getOperators(obj),
    ...Object.keys(obj)
  ];
}
function getOperators(obj) {
  return Object.getOwnPropertySymbols(obj).filter((s) => operatorsSet.has(s));
}
function combineTableNames(tableName1, tableName2) {
  return tableName1.toLowerCase() < tableName2.toLowerCase() ? tableName1 + tableName2 : tableName2 + tableName1;
}
function mapValueFieldNames(dataValues, attributeNames, ModelClass) {
  var _a;
  const values = /* @__PURE__ */ Object.create(null);
  for (const attributeName of attributeNames) {
    if (dataValues[attributeName] !== void 0 && !ModelClass._virtualAttributes.has(attributeName)) {
      const columnName = ((_a = ModelClass.rawAttributes[attributeName]) == null ? void 0 : _a.field) ?? attributeName;
      values[columnName] = dataValues[attributeName];
    }
  }
  return values;
}
function removeNullishValuesFromHash(hash, omitNull, options) {
  let result = hash;
  const allowNull = (options == null ? void 0 : options.allowNull) ?? [];
  if (!omitNull) {
    return result;
  }
  const _hash = /* @__PURE__ */ Object.create(null);
  (0, import_forIn.default)(hash, (val, key) => {
    if (allowNull.includes(key) || key.endsWith("Id") || val !== null && val !== void 0) {
      _hash[key] = val;
    }
  });
  result = _hash;
  return result;
}
function generateEnumName(tableName, columnName) {
  return `enum_${tableName}_${columnName}`;
}
function getColumnName(attribute) {
  (0, import_assert.default)(attribute.fieldName != null, "getColumnName expects a normalized attribute meta");
  return attribute.field || attribute.fieldName;
}
//# sourceMappingURL=format.js.map
