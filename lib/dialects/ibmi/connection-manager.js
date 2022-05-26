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
var connection_manager_exports = {};
__export(connection_manager_exports, {
  IBMiConnectionManager: () => IBMiConnectionManager
});
module.exports = __toCommonJS(connection_manager_exports);
const { ConnectionManager } = require("../abstract/connection-manager");
const SequelizeErrors = require("../../errors");
const { logger } = require("../../utils/logger");
const debug = logger.debugContext("connection:ibmi");
const parserStore = require("../parserStore")("ibmi");
const DataTypes = require("../../data-types").ibmi;
class IBMiConnectionManager extends ConnectionManager {
  constructor(dialect, sequelize) {
    super(dialect, sequelize);
    this.connections = {};
    this.lib = this._loadDialectModule("odbc");
    this.refreshTypeParser(DataTypes);
  }
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }
  _clearTypeParser() {
    parserStore.clear();
  }
  async connect(config) {
    const connectionKeywords = [];
    if (config.dialectOptions && config.dialectOptions.odbcConnectionString) {
      connectionKeywords.push(config.dialectOptions.odbcConnectionString);
    }
    if (config.database) {
      connectionKeywords.push(`DSN=${config.database}`);
    }
    if (config.username) {
      connectionKeywords.push(`UID=${config.username}`);
    }
    if (config.password) {
      connectionKeywords.push(`PWD=${config.password}`);
    }
    if (config.host) {
      connectionKeywords.push(`SYSTEM=${config.host}`);
    }
    const connectionString = connectionKeywords.join(";");
    if (connectionString.charAt(connectionString.length - 1) !== ";") {
      connectionString.concat(";");
    }
    let connection;
    try {
      connection = await this.lib.connect(connectionString);
    } catch (error) {
      if (error.toString().includes("Error connecting to the database")) {
        const err = new SequelizeErrors.ConnectionRefusedError(error);
        throw err;
      }
    }
    return connection;
  }
  async disconnect(connection) {
    return new Promise((resolve, reject) => {
      if (!this.validate(connection)) {
        debug("Tried to disconnect, but connection was already closed.");
        resolve();
      }
      connection.close((error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  }
  validate(connection) {
    return connection.isConnected;
  }
}
//# sourceMappingURL=connection-manager.js.map
