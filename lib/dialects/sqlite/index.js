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
var sqlite_exports = {};
__export(sqlite_exports, {
  SqliteDialect: () => SqliteDialect
});
module.exports = __toCommonJS(sqlite_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { SqliteConnectionManager } = require("./connection-manager");
const { SqliteQuery } = require("./query");
const { SqliteQueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").sqlite;
const { SqliteQueryInterface } = require("./query-interface");
class SqliteDialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    DEFAULT: false,
    "DEFAULT VALUES": true,
    "UNION ALL": false,
    "RIGHT JOIN": false,
    inserts: {
      ignoreDuplicates: " OR IGNORE",
      updateOnDuplicate: " ON CONFLICT DO UPDATE SET",
      conflictFields: true
    },
    index: {
      using: false,
      where: true,
      functionBased: true
    },
    transactionOptions: {
      type: true
    },
    constraints: {
      addConstraint: false,
      dropConstraint: false
    },
    groupedLimit: false,
    JSON: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new SqliteConnectionManager(this, sequelize);
    this.queryGenerator = new SqliteQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new SqliteQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createNamedParamBindCollector)("$");
  }
}
SqliteDialect.prototype.defaultVersion = "3.8.0";
SqliteDialect.prototype.Query = SqliteQuery;
SqliteDialect.prototype.DataTypes = DataTypes;
SqliteDialect.prototype.name = "sqlite";
SqliteDialect.prototype.TICK_CHAR = "`";
SqliteDialect.prototype.TICK_CHAR_LEFT = SqliteDialect.prototype.TICK_CHAR;
SqliteDialect.prototype.TICK_CHAR_RIGHT = SqliteDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
