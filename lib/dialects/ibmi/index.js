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
var ibmi_exports = {};
__export(ibmi_exports, {
  IBMiDialect: () => IBMiDialect
});
module.exports = __toCommonJS(ibmi_exports);
var import_sql = require("../../utils/sql");
const _ = require("lodash");
const { AbstractDialect } = require("../abstract");
const { IBMiConnectionManager } = require("./connection-manager");
const { IBMiQuery } = require("./query");
const { IBMiQueryGenerator } = require("./query-generator");
const { IBMiQueryInterface } = require("./query-interface");
const DataTypes = require("../../data-types").ibmi;
class IBMiDialect extends AbstractDialect {
  static supports = _.merge(_.cloneDeep(AbstractDialect.supports), {
    "VALUES ()": true,
    "ON DUPLICATE KEY": false,
    transactions: false,
    bulkDefault: true,
    index: {
      using: false,
      where: true,
      functionBased: true,
      collate: false
    },
    constraints: {
      onUpdate: false
    },
    groupedLimit: false,
    JSON: false,
    upserts: false,
    schemas: true
  });
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new IBMiConnectionManager(this, sequelize);
    this.queryGenerator = new IBMiQueryGenerator({
      _dialect: this,
      sequelize
    });
    this.queryInterface = new IBMiQueryInterface(this.sequelize, this.queryGenerator);
  }
  createBindCollector() {
    return (0, import_sql.createUnspecifiedOrderedBindCollector)();
  }
}
IBMiDialect.prototype.defaultVersion = "7.3.0";
IBMiDialect.prototype.Query = IBMiQuery;
IBMiDialect.prototype.DataTypes = DataTypes;
IBMiDialect.prototype.name = "ibmi";
IBMiDialect.prototype.TICK_CHAR = '"';
IBMiDialect.prototype.TICK_CHAR_LEFT = IBMiDialect.prototype.TICK_CHAR;
IBMiDialect.prototype.TICK_CHAR_RIGHT = IBMiDialect.prototype.TICK_CHAR;
//# sourceMappingURL=index.js.map
