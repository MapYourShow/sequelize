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
var db2_exports = {};
__export(db2_exports, {
  Db2Dialect: () => Db2Dialect
});
module.exports = __toCommonJS(db2_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { Db2ConnectionManager } = require("./connection-manager");
const { Db2Query } = require("./query");
const { Db2QueryGenerator } = require("./query-generator");
const DataTypes = require("../../data-types").db2;
const { Db2QueryInterface } = require("./query-interface");
class Db2Dialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    migrations: false,
    schemas: true,
    finalTable: true,
    autoIncrement: {
      defaultValue: false
    },
    index: {
      collate: false,
      using: false,
      where: true
    },
    NUMERIC: true,
    tmpTableTrigger: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new Db2ConnectionManager(this, sequelize);
    this.queryGenerator = new Db2QueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new Db2QueryInterface(sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createUnspecifiedOrderedBindCollector)();
  }
}
Db2Dialect.prototype.defaultVersion = "1.0.0";
Db2Dialect.prototype.Query = Db2Query;
Db2Dialect.prototype.name = "db2";
Db2Dialect.prototype.TICK_CHAR = '"';
Db2Dialect.prototype.TICK_CHAR_LEFT = '"';
Db2Dialect.prototype.TICK_CHAR_RIGHT = '"';
Db2Dialect.prototype.DataTypes = DataTypes;
//# sourceMappingURL=index.js.map
