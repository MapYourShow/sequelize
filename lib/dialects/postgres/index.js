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
var postgres_exports = {};
__export(postgres_exports, {
  PostgresDialect: () => PostgresDialect
});
module.exports = __toCommonJS(postgres_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { PostgresConnectionManager } = require("./connection-manager");
const { PostgresQuery } = require("./query");
const { PostgresQueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").postgres;
const { PostgresQueryInterface } = require("./query-interface");
class PostgresDialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    "DEFAULT VALUES": true,
    EXCEPTION: true,
    "ON DUPLICATE KEY": false,
    "ORDER NULLS": true,
    returnValues: {
      returning: true
    },
    bulkDefault: true,
    schemas: true,
    lock: true,
    lockOf: true,
    lockKey: true,
    lockOuterJoinFailure: true,
    skipLocked: true,
    forShare: "FOR SHARE",
    index: {
      concurrently: true,
      using: 2,
      where: true,
      functionBased: true,
      operator: true
    },
    inserts: {
      onConflictDoNothing: " ON CONFLICT DO NOTHING",
      updateOnDuplicate: " ON CONFLICT DO UPDATE SET",
      conflictFields: true
    },
    NUMERIC: true,
    ARRAY: true,
    RANGE: true,
    GEOMETRY: true,
    REGEXP: true,
    IREGEXP: true,
    GEOGRAPHY: true,
    JSON: true,
    JSONB: true,
    HSTORE: true,
    TSVECTOR: true,
    deferrableConstraints: true,
    searchPath: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new PostgresConnectionManager(this, sequelize);
    this.queryGenerator = new PostgresQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new PostgresQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createSpecifiedOrderedBindCollector)();
  }
}
PostgresDialect.prototype.defaultVersion = "9.5.0";
PostgresDialect.prototype.Query = PostgresQuery;
PostgresDialect.prototype.DataTypes = DataTypes;
PostgresDialect.prototype.name = "postgres";
PostgresDialect.prototype.TICK_CHAR = '"';
PostgresDialect.prototype.TICK_CHAR_LEFT = PostgresDialect.prototype.TICK_CHAR;
PostgresDialect.prototype.TICK_CHAR_RIGHT = PostgresDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
