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
var abstract_exports = {};
__export(abstract_exports, {
  AbstractDialect: () => AbstractDialect
});
module.exports = __toCommonJS(abstract_exports);
class AbstractDialect {
  static supports = {
    DEFAULT: true,
    "DEFAULT VALUES": false,
    "VALUES ()": false,
    "LIMIT ON UPDATE": false,
    "ON DUPLICATE KEY": true,
    "ORDER NULLS": false,
    UNION: true,
    "UNION ALL": true,
    "RIGHT JOIN": true,
    EXCEPTION: false,
    lock: false,
    lockOf: false,
    lockKey: false,
    lockOuterJoinFailure: false,
    skipLocked: false,
    finalTable: false,
    returnValues: false,
    autoIncrement: {
      identityInsert: false,
      defaultValue: true,
      update: true
    },
    bulkDefault: false,
    schemas: false,
    transactions: true,
    settingIsolationLevelDuringTransaction: true,
    transactionOptions: {
      type: false
    },
    migrations: true,
    upserts: true,
    inserts: {
      ignoreDuplicates: "",
      updateOnDuplicate: false,
      onConflictDoNothing: "",
      conflictFields: false
    },
    constraints: {
      restrict: true,
      addConstraint: true,
      dropConstraint: true,
      unique: true,
      default: false,
      check: true,
      foreignKey: true,
      primaryKey: true,
      onUpdate: true
    },
    index: {
      collate: true,
      length: false,
      parser: false,
      concurrently: false,
      type: false,
      using: true,
      functionBased: false,
      operator: false,
      where: false
    },
    groupedLimit: true,
    indexViaAlter: false,
    JSON: false,
    JSONB: false,
    NUMERIC: false,
    ARRAY: false,
    RANGE: false,
    GEOMETRY: false,
    REGEXP: false,
    IREGEXP: false,
    GEOGRAPHY: false,
    HSTORE: false,
    TSVECTOR: false,
    deferrableConstraints: false,
    tmpTableTrigger: false,
    indexHints: false,
    searchPath: false
  };
  get supports() {
    const Dialect = this.constructor;
    return Dialect.supports;
  }
}
//# sourceMappingURL=index.js.map
