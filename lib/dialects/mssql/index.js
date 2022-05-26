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
var mssql_exports = {};
__export(mssql_exports, {
  MssqlDialect: () => MssqlDialect
});
module.exports = __toCommonJS(mssql_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { MsSqlConnectionManager } = require("./connection-manager");
const { MsSqlQuery } = require("./query");
const { MsSqlQueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").mssql;
const { MsSqlQueryInterface } = require("./query-interface");
class MssqlDialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    "DEFAULT VALUES": true,
    "LIMIT ON UPDATE": true,
    migrations: false,
    returnValues: {
      output: true
    },
    schemas: true,
    autoIncrement: {
      identityInsert: true,
      defaultValue: false,
      update: false
    },
    constraints: {
      restrict: false,
      default: true
    },
    index: {
      collate: false,
      type: true,
      using: false,
      where: true
    },
    NUMERIC: true,
    tmpTableTrigger: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new MsSqlConnectionManager(this, sequelize);
    this.queryGenerator = new MsSqlQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new MsSqlQueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createNamedParamBindCollector)("@");
  }
}
MssqlDialect.prototype.defaultVersion = "14.0.1000";
MssqlDialect.prototype.Query = MsSqlQuery;
MssqlDialect.prototype.name = "mssql";
MssqlDialect.prototype.TICK_CHAR = '"';
MssqlDialect.prototype.TICK_CHAR_LEFT = "[";
MssqlDialect.prototype.TICK_CHAR_RIGHT = "]";
MssqlDialect.prototype.DataTypes = DataTypes;
//# sourceMappingURL=index.js.map
