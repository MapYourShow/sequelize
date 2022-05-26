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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  getComplexSize: () => getComplexSize
});
module.exports = __toCommonJS(utils_exports);
var import_format = require("./format");
__reExport(utils_exports, require("./array"), module.exports);
__reExport(utils_exports, require("./check"), module.exports);
__reExport(utils_exports, require("./class-to-invokable"), module.exports);
__reExport(utils_exports, require("./dialect"), module.exports);
__reExport(utils_exports, require("./format"), module.exports);
__reExport(utils_exports, require("./join-sql-fragments"), module.exports);
__reExport(utils_exports, require("./object"), module.exports);
__reExport(utils_exports, require("./sequelize-method"), module.exports);
__reExport(utils_exports, require("./string"), module.exports);
__reExport(utils_exports, require("./dayjs"), module.exports);
function getComplexSize(obj) {
  return Array.isArray(obj) ? obj.length : (0, import_format.getComplexKeys)(obj).length;
}
//# sourceMappingURL=index.js.map
