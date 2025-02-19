"use strict";
const wkx = require("wkx");
const _ = require("lodash");
const dayjs = require("dayjs");
const { isValidTimeZone } = require("../../utils/dayjs");
module.exports = (BaseTypes) => {
  BaseTypes.ABSTRACT.prototype.dialectTypes = "https://mariadb.com/kb/en/library/resultset/#field-types";
  BaseTypes.DATE.types.mariadb = ["DATETIME"];
  BaseTypes.STRING.types.mariadb = ["VAR_STRING"];
  BaseTypes.CHAR.types.mariadb = ["STRING"];
  BaseTypes.TEXT.types.mariadb = ["BLOB"];
  BaseTypes.TINYINT.types.mariadb = ["TINY"];
  BaseTypes.SMALLINT.types.mariadb = ["SHORT"];
  BaseTypes.MEDIUMINT.types.mariadb = ["INT24"];
  BaseTypes.INTEGER.types.mariadb = ["LONG"];
  BaseTypes.BIGINT.types.mariadb = ["LONGLONG"];
  BaseTypes.FLOAT.types.mariadb = ["FLOAT"];
  BaseTypes.TIME.types.mariadb = ["TIME"];
  BaseTypes.DATEONLY.types.mariadb = ["DATE"];
  BaseTypes.BOOLEAN.types.mariadb = ["TINY"];
  BaseTypes.BLOB.types.mariadb = ["TINYBLOB", "BLOB", "LONGBLOB"];
  BaseTypes.DECIMAL.types.mariadb = ["NEWDECIMAL"];
  BaseTypes.UUID.types.mariadb = false;
  BaseTypes.ENUM.types.mariadb = false;
  BaseTypes.REAL.types.mariadb = ["DOUBLE"];
  BaseTypes.DOUBLE.types.mariadb = ["DOUBLE"];
  BaseTypes.GEOMETRY.types.mariadb = ["GEOMETRY"];
  BaseTypes.JSON.types.mariadb = ["JSON"];
  class DECIMAL extends BaseTypes.DECIMAL {
    toSql() {
      let definition = super.toSql();
      if (this._unsigned) {
        definition += " UNSIGNED";
      }
      if (this._zerofill) {
        definition += " ZEROFILL";
      }
      return definition;
    }
  }
  class DATE extends BaseTypes.DATE {
    toSql() {
      return this._length ? `DATETIME(${this._length})` : "DATETIME";
    }
    _stringify(date, options) {
      return this._applyTimezone(date, options).format("YYYY-MM-DD HH:mm:ss.SSS");
    }
    static parse(value, options) {
      value = value.string();
      if (value === null) {
        return value;
      }
      if (isValidTimeZone(options.timezone)) {
        value = dayjs.tz(value, options.timezone).toDate();
      } else {
        value = new Date(`${value} ${options.timezone}`);
      }
      return value;
    }
  }
  class DATEONLY extends BaseTypes.DATEONLY {
    static parse(value) {
      return value.string();
    }
  }
  class UUID extends BaseTypes.UUID {
    toSql() {
      return "CHAR(36) BINARY";
    }
  }
  class GEOMETRY extends BaseTypes.GEOMETRY {
    constructor(type, srid) {
      super(type, srid);
      if (_.isEmpty(this.type)) {
        this.sqlType = this.key;
      } else {
        this.sqlType = this.type;
      }
    }
    static parse(value) {
      value = value.buffer();
      if (!value || value.length === 0) {
        return null;
      }
      value = value.slice(4);
      return wkx.Geometry.parse(value).toGeoJSON({ shortCrs: true });
    }
    toSql() {
      return this.sqlType;
    }
  }
  class ENUM extends BaseTypes.ENUM {
    toSql(options) {
      return `ENUM(${this.values.map((value) => options.escape(value)).join(", ")})`;
    }
  }
  class JSONTYPE extends BaseTypes.JSON {
    _stringify(value, options) {
      return options.operation === "where" && typeof value === "string" ? value : JSON.stringify(value);
    }
  }
  return {
    ENUM,
    DATE,
    DATEONLY,
    UUID,
    GEOMETRY,
    DECIMAL,
    JSON: JSONTYPE
  };
};
//# sourceMappingURL=data-types.js.map
