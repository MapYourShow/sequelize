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
var mysql_exports = {};
__export(mysql_exports, {
  MysqlDialect: () => MysqlDialect
});
module.exports = __toCommonJS(mysql_exports);
var import_sql = require("../../utils/sql");
var import_abstract = require("../abstract");
const _ = require("lodash");
const { MySqlConnectionManager } = require("./connection-manager");
const { MySqlQuery } = require("./query");
const { MySqlQueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").mysql;
const { MySqlQueryInterface } = require("./query-interface");
class MysqlDialect extends import_abstract.AbstractDialect {
  static supports = _.merge(_.cloneDeep(import_abstract.AbstractDialect.supports), {
    "VALUES ()": true,
    "LIMIT ON UPDATE": true,
    lock: true,
    forShare: "LOCK IN SHARE MODE",
    settingIsolationLevelDuringTransaction: false,
    inserts: {
      ignoreDuplicates: " IGNORE",
      updateOnDuplicate: " ON DUPLICATE KEY UPDATE"
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
    GEOMETRY: true,
    JSON: true,
    REGEXP: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new MySqlConnectionManager(this, sequelize);
    this.queryGenerator = new MySqlQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new MySqlQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createUnspecifiedOrderedBindCollector)();
  }
}
MysqlDialect.prototype.defaultVersion = "5.7.0";
MysqlDialect.prototype.Query = MySqlQuery;
MysqlDialect.prototype.QueryGenerator = MySqlQueryGenerator;
MysqlDialect.prototype.DataTypes = DataTypes;
MysqlDialect.prototype.name = "mysql";
MysqlDialect.prototype.TICK_CHAR = "`";
MysqlDialect.prototype.TICK_CHAR_LEFT = MysqlDialect.prototype.TICK_CHAR;
MysqlDialect.prototype.TICK_CHAR_RIGHT = MysqlDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
