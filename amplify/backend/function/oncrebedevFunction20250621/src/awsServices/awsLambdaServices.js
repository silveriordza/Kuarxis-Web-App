/** @format */
const { LogThis, LoggerSettings, L0 } = require("../utils/Logger");
const srcFile = "awsLambdaServices.js";

const isRunningInLambda = () => {
  const log = new LoggerSettings(srcFile, "isRunningInLambda");
  LogThis(
    log,
    `process.env.AWS_LAMBDA_FUNCTION_NAME=${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
    L0
  );
  return process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
};

module.exports = {
  isRunningInLambda,
};
