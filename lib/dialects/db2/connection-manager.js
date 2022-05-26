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
  Db2ConnectionManager: () => Db2ConnectionManager
});
module.exports = __toCommonJS(connection_manager_exports);
const { ConnectionManager } = require("../abstract/connection-manager");
const sequelizeErrors = require("../../errors");
const { logger } = require("../../utils/logger");
const DataTypes = require("../../data-types").db2;
const debug = logger.debugContext("connection:db2");
const parserStore = require("../parserStore")("db2");
class Db2ConnectionManager extends ConnectionManager {
  constructor(dialect, sequelize) {
    sequelize.config.port = sequelize.config.port || 3306;
    super(dialect, sequelize);
    this.lib = this._loadDialectModule("ibm_db");
    this.refreshTypeParser(DataTypes);
  }
  static _typecast(field, next) {
    if (parserStore.get(field.type)) {
      return parserStore.get(field.type)(field, this.sequelize.options, next);
    }
    return next();
  }
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }
  _clearTypeParser() {
    parserStore.clear();
  }
  async connect(config) {
    const connectionConfig = {
      database: config.database,
      hostname: config.host,
      port: config.port,
      uid: config.username,
      pwd: config.password
    };
    if (config.ssl) {
      connectionConfig.security = config.ssl;
    }
    if (config.sslcertificate) {
      connectionConfig.SSLServerCertificate = config.sslcertificate;
    }
    if (config.dialectOptions) {
      for (const key of Object.keys(config.dialectOptions)) {
        connectionConfig[key] = config.dialectOptions[key];
      }
    }
    try {
      return await new Promise((resolve, reject) => {
        const connection = new this.lib.Database();
        connection.lib = this.lib;
        connection.open(connectionConfig, (error) => {
          if (error) {
            if (error.message && error.message.includes("SQL30081N")) {
              return reject(new sequelizeErrors.ConnectionRefusedError(error));
            }
            return reject(new sequelizeErrors.ConnectionError(error));
          }
          return resolve(connection);
        });
      });
    } catch (error) {
      throw new sequelizeErrors.ConnectionError(error);
    }
  }
  disconnect(connection) {
    if (connection.connected) {
      connection.close((error) => {
        if (error) {
          debug(error);
        } else {
          debug("connection closed");
        }
      });
    }
    return Promise.resolve();
  }
  validate(connection) {
    return connection && connection.connected;
  }
  _disconnect(connection) {
    return this.dialect.connectionManager.disconnect(connection);
  }
}
//# sourceMappingURL=connection-manager.js.map
