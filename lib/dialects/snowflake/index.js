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
var snowflake_exports = {};
__export(snowflake_exports, {
  SnowflakeDialect: () => SnowflakeDialect
});
module.exports = __toCommonJS(snowflake_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { SnowflakeConnectionManager } = require("./connection-manager");
const { SnowflakeQuery } = require("./query");
const { SnowflakeQueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").snowflake;
const { SnowflakeQueryInterface } = require("./query-interface");
class SnowflakeDialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    "VALUES ()": true,
    "LIMIT ON UPDATE": true,
    lock: true,
    forShare: "LOCK IN SHARE MODE",
    settingIsolationLevelDuringTransaction: false,
    inserts: {
      ignoreDuplicates: " IGNORE"
    },
    index: {
      collate: false,
      length: true,
      parser: true,
      type: true,
      using: 1
    },
    constraints: {
      dropConstraint: false,
      check: false
    },
    indexViaAlter: true,
    indexHints: true,
    NUMERIC: true,
    REGEXP: true,
    schemas: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new SnowflakeConnectionManager(this, sequelize);
    this.queryGenerator = new SnowflakeQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new SnowflakeQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createUnspecifiedOrderedBindCollector)();
  }
}
SnowflakeDialect.prototype.defaultVersion = "5.7.0";
SnowflakeDialect.prototype.Query = SnowflakeQuery;
SnowflakeDialect.prototype.QueryGenerator = SnowflakeQueryGenerator;
SnowflakeDialect.prototype.DataTypes = DataTypes;
SnowflakeDialect.prototype.name = "snowflake";
SnowflakeDialect.prototype.TICK_CHAR = '"';
SnowflakeDialect.prototype.TICK_CHAR_LEFT = SnowflakeDialect.prototype.TICK_CHAR;
SnowflakeDialect.prototype.TICK_CHAR_RIGHT = SnowflakeDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
