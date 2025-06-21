/** @format */

const aws = require("aws-sdk");
const { LogThis, LoggerSettings, L0, L3 } = require("../utils/Logger");
const srcFile = "awsMiscellaneous.js";
const ssm = new aws.SSM({ region: "us-east-1" });
//SSM is the AWS Systems Management SDK that Kuarsis is using to get secrets from the Parameters Store which are encrypted.
//const ssm = new aws.SSM({ region: "us-east-1" });

const getSecretParamNameFromEnv = (varName) => {
  const parameterName =
    "/amplify/" +
    process.env.KUARSIS_AMPLIFY_APPID +
    "/" +
    process.env.ENV +
    "/AMPLIFY_" +
    process.env.KUARSIS_AMPLIFY_FUNCTION_NAME +
    "_" +
    varName;
  return parameterName;
};

const getSecretValue = async (varName) => {
  const log = new LoggerSettings(srcFile, "getSecretValue");
  LogThis(log, `START varName=${varName}`, L3);
  const amplifySecretName = getSecretParamNameFromEnv(varName);
  LogThis(log, `amplifySecretName=${amplifySecretName}`, L3);
  const data = await ssm
    .getParameters({
      Names: [amplifySecretName],
      WithDecryption: true,
    })
    .promise();

  const Parameters = data.Parameters;

  if (Parameters && Parameters.length > 0) {
    return Parameters[0].Value;
  } else {
    LogThis(log, `Parameter varName=${varName} not found`, L0);
    throw Error(`Parameter varName=${varName} not found`);
  }
};

module.exports = {
  getSecretParamNameFromEnv,
  getSecretValue,
};
