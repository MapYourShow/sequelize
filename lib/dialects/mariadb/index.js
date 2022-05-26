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
var mariadb_exports = {};
__export(mariadb_exports, {
  MariaDbDialect: () => MariaDbDialect
});
module.exports = __toCommonJS(mariadb_exports);
var import_sql = require("../../utils/sql");
var import_abstract = require("../abstract");
const _ = require("lodash");
const { MariaDbConnectionManager } = require("./connection-manager");
const { MariaDbQuery } = require("./query");
const { MariaDbQueryGenerator } = require("./query-generator");
const { MySqlQueryInterface } = require("../mysql/query-interface");
const DataTypes = require("../../data-types").mariadb;
class MariaDbDialect extends import_abstract.AbstractDialect {
  static supports = _.merge(_.cloneDeep(import_abstract.AbstractDialect.supports), {
    "VALUES ()": true,
    "LIMIT ON UPDATE": true,
    lock: true,
    forShare: "LOCK IN SHARE MODE",
    settingIsolationLevelDuringTransaction: false,
    schemas: true,
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
    this.connectionManager = new MariaDbConnectionManager(this, sequelize);
    this.queryGenerator = new MariaDbQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new MySqlQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createUnspecifiedOrderedBindCollector)();
  }
}
MariaDbDialect.prototype.defaultVersion = "10.1.44";
MariaDbDialect.prototype.Query = MariaDbQuery;
MariaDbDialect.prototype.QueryGenerator = MariaDbQueryGenerator;
MariaDbDialect.prototype.DataTypes = DataTypes;
MariaDbDialect.prototype.name = "mariadb";
MariaDbDialect.prototype.TICK_CHAR = "`";
MariaDbDialect.prototype.TICK_CHAR_LEFT = MariaDbDialect.prototype.TICK_CHAR;
MariaDbDialect.prototype.TICK_CHAR_RIGHT = MariaDbDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
