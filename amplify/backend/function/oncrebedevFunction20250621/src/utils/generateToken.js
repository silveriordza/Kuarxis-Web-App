/** @format */

let jwt = require("jsonwebtoken");
const { LogThis, LoggerSettings, L0 } = require("./Logger");
const srcFile = "generateToken.js";

const generateToken = (id) => {
  const log = new LoggerSettings(srcFile, "generateToken");
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = generateToken;
