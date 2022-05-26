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
  MsSqlConnectionManager: () => MsSqlConnectionManager
});
module.exports = __toCommonJS(connection_manager_exports);
const { ConnectionManager } = require("../abstract/connection-manager");
const { AsyncQueue } = require("./async-queue");
const { logger } = require("../../utils/logger");
const sequelizeErrors = require("../../errors");
const DataTypes = require("../../data-types").mssql;
const parserStore = require("../parserStore")("mssql");
const debug = logger.debugContext("connection:mssql");
const debugTedious = logger.debugContext("connection:mssql:tedious");
class MsSqlConnectionManager extends ConnectionManager {
  constructor(dialect, sequelize) {
    sequelize.config.port = sequelize.config.port || 1433;
    super(dialect, sequelize);
    this.lib = this._loadDialectModule("tedious");
    this.refreshTypeParser(DataTypes);
  }
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }
  _clearTypeParser() {
    parserStore.clear();
  }
  async connect(config) {
    const connectionConfig = {
      server: config.host,
      authentication: {
        type: "default",
        options: {
          userName: config.username || void 0,
          password: config.password || void 0
        }
      },
      options: {
        port: Number.parseInt(config.port, 10),
        database: config.database,
        trustServerCertificate: true
      }
    };
    if (config.dialectOptions) {
      if (config.dialectOptions.options && config.dialectOptions.options.instanceName) {
        delete connectionConfig.options.port;
      }
      if (config.dialectOptions.authentication) {
        Object.assign(connectionConfig.authentication, config.dialectOptions.authentication);
      }
      Object.assign(connectionConfig.options, config.dialectOptions.options);
    }
    try {
      return await new Promise((resolve, reject) => {
        const connection = new this.lib.Connection(connectionConfig);
        if (connection.state === connection.STATE.INITIALIZED) {
          connection.connect();
        }
        connection.queue = new AsyncQueue();
        connection.lib = this.lib;
        const connectHandler = (error) => {
          connection.removeListener("end", endHandler);
          connection.removeListener("error", errorHandler);
          if (error) {
            return reject(error);
          }
          debug("connection acquired");
          resolve(connection);
        };
        const endHandler = () => {
          connection.removeListener("connect", connectHandler);
          connection.removeListener("error", errorHandler);
          reject(new Error("Connection was closed by remote server"));
        };
        const errorHandler = (error) => {
          connection.removeListener("connect", connectHandler);
          connection.removeListener("end", endHandler);
          reject(error);
        };
        connection.once("error", errorHandler);
        connection.once("end", endHandler);
        connection.once("connect", connectHandler);
        connection.on("error", (error) => {
          switch (error.code) {
            case "ESOCKET":
            case "ECONNRESET":
              this.pool.destroy(connection);
          }
        });
        if (config.dialectOptions && config.dialectOptions.debug) {
          connection.on("debug", debugTedious.log.bind(debugTedious));
        }
      });
    } catch (error) {
      if (!error.code) {
        throw new sequelizeErrors.ConnectionError(error);
      }
      switch (error.code) {
        case "ESOCKET":
          if (error.message.includes("connect EHOSTUNREACH")) {
            throw new sequelizeErrors.HostNotReachableError(error);
          }
          if (error.message.includes("connect ENETUNREACH")) {
            throw new sequelizeErrors.HostNotReachableError(error);
          }
          if (error.message.includes("connect EADDRNOTAVAIL")) {
            throw new sequelizeErrors.HostNotReachableError(error);
          }
          if (error.message.includes("getaddrinfo ENOTFOUND")) {
            throw new sequelizeErrors.HostNotFoundError(error);
          }
          if (error.message.includes("connect ECONNREFUSED")) {
            throw new sequelizeErrors.ConnectionRefusedError(error);
          }
          throw new sequelizeErrors.ConnectionError(error);
        case "ER_ACCESS_DENIED_ERROR":
        case "ELOGIN":
          throw new sequelizeErrors.AccessDeniedError(error);
        case "EINVAL":
          throw new sequelizeErrors.InvalidConnectionError(error);
        default:
          throw new sequelizeErrors.ConnectionError(error);
      }
    }
  }
  async disconnect(connection) {
    if (connection.closed) {
      return;
    }
    connection.queue.close();
    return new Promise((resolve) => {
      connection.on("end", resolve);
      connection.close();
      debug("connection closed");
    });
  }
  validate(connection) {
    return connection && (connection.loggedIn || connection.state.name === "LoggedIn");
  }
}
//# sourceMappingURL=connection-manager.js.map
