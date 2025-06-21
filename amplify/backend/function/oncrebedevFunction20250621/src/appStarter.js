/**
 * Use the following code to retrieve configured secrets from SSM:
 *
 * const aws = require('aws-sdk');
 *
 * const { Parameters } = await (new aws.SSM())
 *   .getParameters({
 *     Names: ["MONGO_URI","JWT_SECRET","PAYPAL_CLIENT_ID","KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY","KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY"].map(secretName => process.env[secretName]),
 *     WithDecryption: true,
 *   })
 *   .promise();
 *
 * Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
 *
 * @format
 */

/**
 * Use the following code to retrieve configured secrets from SSM:
 *
 * const aws = require('aws-sdk');
 *
 * const { Parameters } = await (new aws.SSM())
 *   .getParameters({
 *     Names: ["MONGO_URI","JWT_SECRET","PAYPAL_CLIENT_ID","KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY","KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY"].map(secretName => process.env[secretName]),
 *     WithDecryption: true,
 *   })
 *   .promise();
 *
 * Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
 *
 * @format
 */

/**
 * Use the following code to retrieve configured secrets from SSM:
 *
 * const aws = require('aws-sdk');
 *
 * const { Parameters } = await (new aws.SSM())
 *   .getParameters({
 *     Names: ["MONGO_URI","JWT_SECRET","PAYPAL_CLIENT_ID","KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY","KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY"].map(secretName => process.env[secretName]),
 *     WithDecryption: true,
 *   })
 *   .promise();
 *
 * Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
 *
 * @format
 */

/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["MONGO_URI","JWT_SECRET","PAYPAL_CLIENT_ID","KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY","KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["MONGO_URI","JWT_SECRET","PAYPAL_CLIENT_ID","KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY","KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	NODE_ENV
	PORT
	MONGO_URI
	JWT_SECRET
	PAYPAL_CLIENT_ID
Amplify Params - DO NOT EDIT */

const { LogThis, LoggerSettings, L1, L3, L0 } = require('./utils/Logger.js')

const { loadDynamicModelsFromDB } = require('./utils/mongoDbHelper.js')
const aws = require('aws-sdk')
let dotenv = require('dotenv')
let myEnv = dotenv.config()
const srcFile = 'appStarter.js'
const logMain = new LoggerSettings(srcFile, 'appStarter.js Main')
let express = require('express')
let morgan = require('morgan')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
LogThis(logMain, 'Before let connectDB', L0)
let connectDB = require('./config/db.js')
LogThis(logMain, 'After let connectDB', L0)
let userRoutes = require('./routes/userRoutes.js')
let productRoutes = require('./routes/productRoutes.js')
let surveyRoutes = require('./routes/surveyRoutes.js')
let orderRoutes = require('./routes/orderRoutes.js')
let schedulerRoutes = require('./routes/schedulerRoutes.js')
let uploadRoutes = require('./routes/uploadRoutes.js')
let configsRoutes = require('./routes/configsRoutes.js')
var bodyParser = require('body-parser')

const getSecretParamNameFromEnv = varName => {
   const parameterName =
      '/amplify/' +
      process.env.KUARSIS_AMPLIFY_APPID +
      '/' +
      process.env.ENV +
      '/AMPLIFY_' +
      process.env.KUARSIS_AMPLIFY_FUNCTION_NAME +
      '_' +
      varName
   return parameterName
}

const mongoUriParam = getSecretParamNameFromEnv(process.env.MONGO_URI_VAR)
const jwtSecretParam = getSecretParamNameFromEnv(process.env.JWT_SECRET_VAR)
const paypalClientIdParam = getSecretParamNameFromEnv(
   process.env.PAYPAL_CLIENT_ID_VAR,
)
const accessKeyParam = getSecretParamNameFromEnv(
   process.env.KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY_VAR,
)
const secretKeyParam = getSecretParamNameFromEnv(
   process.env.KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY_VAR,
)

const monkeyTokenParam = getSecretParamNameFromEnv(
   process.env.KUARSIS_SURVEY_MONKEY_TOKEN_VAR,
)
const params = {
   Names: [
      mongoUriParam,
      jwtSecretParam,
      paypalClientIdParam,
      accessKeyParam,
      secretKeyParam,
      monkeyTokenParam,
   ],
   WithDecryption: true,
}

//loadParameters is a function used as a call back by the SSM (AWS Systems Management) call to get secret values from the Parameters Store in AWS.
const loadParameters = data => {
   const log = new LoggerSettings(srcFile, 'loadParameters')
   LogThis(log, 'loadParameteres STARTED', L0)

   //In the switch below, the env variables ending in _PARAM, is the name of the parameter as amplify stored it in the AWS SSM (systems management) Parameters Store, this are devined in the .env file and also as environment variables of the Lambda function using "amplify function update" option Environment Variables and added the variables there.  The variables ending in _VAR are also in the .env file, and those are the final names that the _PARAM variables will end up having in the process.env list.  Param.Value is the value of the secret variable that was provided by the ssm.getParameters function.
   //We did the code below to add the secret values coming from the AWS Parameters Store, and added them to the process.env.

   data.Parameters.map(param => {
      LogThis(log, `Processing param.Name=${param.Name}`, L0)
      switch (param.Name) {
         case mongoUriParam: {
            process.env[process.env.MONGO_URI_VAR] = param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.MONGO_URI_VAR]=${
                  process.env[process.env.MONGO_URI_VAR]
               }`,
               L0,
            )
            break
         }
         case jwtSecretParam:
            process.env[process.env.JWT_SECRET_VAR] = param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.JWT_SECRET_VAR]=${
                  process.env[process.env.JWT_SECRET_VAR]
               }`,
               L0,
            )
            break
         case paypalClientIdParam:
            process.env[process.env.PAYPAL_CLIENT_ID_VAR] = param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.PAYPAL_CLIENT_ID_VAR]=${
                  process.env[process.env.PAYPAL_CLIENT_ID_VAR]
               }`,
               L0,
            )
            break
         case accessKeyParam:
            process.env[process.env.KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY_VAR] =
               param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY_VAR]=${
                  process.env[
                     process.env.KUARSIS_AWS_PRODUCTS_S3_ACCESS_KEY_VAR
                  ]
               }`,
               L0,
            )
            break
         case secretKeyParam:
            process.env[process.env.KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY_VAR] =
               param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY_VAR]=${
                  process.env[
                     process.env.KUARSIS_AWS_PRODUCTS_S3_SECRET_KEY_VAR
                  ]
               }`,
               L3,
            )
            break
         case monkeyTokenParam:
            process.env[process.env.KUARSIS_SURVEY_MONKEY_TOKEN_VAR] =
               param.Value
            LogThis(
               log,
               `Processing param.Value=${
                  param.Value
               }; process.env[process.env.KUARSIS_SURVEY_MONKEY_TOKEN_VAR]=${
                  process.env[process.env.KUARSIS_SURVEY_MONKEY_TOKEN_VAR]
               }`,
               L3,
            )
            break

         default:
            break
      }
   })

   //Connecting to MongoDB via mongoose
   //Moved the connectDB call inside the callback function loadParameters which is invoked by the ssm.getParameters (below). The getParameters function is in nature asyncrhonous, the execution will not wait for the getParameters to return, if the connectDB() is invoked outside the loadParameters (which is callback of getParameters), it will be invoked before the MONGO_URI is updated with its secret value from getParameters, hence the connectDB will fail because it has an undefined URI. Therefore, connectDB is not invoked within the callback function loadParameters.
   // connectDB();
   // loadDynamicModelsFromDB();
}

async function getSSMSecretParams() {
   const log = new LoggerSettings(srcFile, 'getSSMSecretParams')
   LogThis(log, `START`, L0)
   //SSM is the AWS Systems Management SDK that Kuarsis is using to get secrets from the Parameters Store which are encrypted.
   const ssm = new aws.SSM({ region: 'us-east-1' })
   LogThis(log, `Created SSM object`, L0)

   try {
      //The user that amplify is using to authenticate into the AWS account, has to have the permissions to execute the getParameters using SSM.
      //After studying the ssm.getParameters function it turns out it returns an AWS.Request object, and in case getParameters does not provide a callback function (which is the case in code below), it will return an AWS.request that has not been sent yet (not requested). There are 2 ways of executing the request in this case, one is registering to a request even with Parameters.On(event, callback), or by invoking the .promise() function which in turn will return a Promise object, that can be handled with the usual .then and .catch.  In this case .then of the AWS.request promise recevies 2 parameters, one is the callback in case the request is successful (in case below it will callback loadParameters), and the 2nd. parameter is the error in case the request failed.
      LogThis(log, `Loading parameters params=${JSON.stringify(params)}`, L0)
      const paramsData = await ssm.getParameters(params).promise()
      LogThis(log, `About to call loadParameters`, L0)
      loadParameters(paramsData)
      LogThis(log, `loadParameters ended`, L0)
   } catch (error) {
      LogThis(log, `Error loading SSM Secret Parameters`)
   }
}
// declare a new express app

const startApp = async () => {
   return new Promise(async (resolve, reject) => {
      try {
         const appStarter = express()
         const log = new LoggerSettings(srcFile, 'startApp')
         LogThis(log, `START`, L0)

         LogThis(log, `About to invoke await getSSMSecretParams`, L0)
         await getSSMSecretParams()
         LogThis(log, `ended getSSMSecretParams`, L0)

         LogThis(log, `Connecting to DB`, L0)
         await connectDB()
         LogThis(log, `Connected to DB`, L0)
         LogThis(log, `About to invoke loadDynamicModelsFromDB`, L0)
         await loadDynamicModelsFromDB()
         LogThis(log, `ended loadDynamicModelsFromDB`, L0)

         appStarter.use(express.json({ limit: '300kb' }))

         // THIS IS MORGAN FUNCTIONALITY to log in the HTTP requests in the console only when we are in development environment
         if (process.env.NODE_ENV === 'development') {
            appStarter.use(morgan('dev'))
         }

         appStarter.use(bodyParser.json())
         LogThis(log, `About to set serverlessExpressMiddleware`, L0)
         appStarter.use(awsServerlessExpressMiddleware.eventContext())
         LogThis(log, `serverlessExpressMiddleware setted`, L0)
         // Enable CORS for all methods
         appStarter.use(function (req, res, next) {
            LogThis(log, `Seeting access controls`, L0)
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Headers', '*')
            res.header(
               'Access-Control-Allow-Methods',
               'DELETE, POST, PUT, GET, OPTIONS',
            )
            LogThis(log, `Set access controls`, L0)
            next()
         })

         /**********************
          * Example get method *
          **********************/
         LogThis(log, `setting users route`, L0)
         appStarter.use('/users', userRoutes)
         LogThis(log, `users route set`, L0)
         appStarter.use('/products', productRoutes)
         appStarter.use('/surveys', surveyRoutes)
         appStarter.use('/orders', orderRoutes)
         appStarter.use('/scheduler', schedulerRoutes)
         appStarter.use('/upload', uploadRoutes)
         appStarter.use('/configs', configsRoutes)
         appStarter.get('/config/paypal', (req, res) =>
            res.send(process.env.PAYPAL_CLIENT_ID),
         )

         // This route is only to fetch the server for the paypal client id which is in an environment variable and then return it to the client to execute the payment.
         //appStarter.get('/config/paypal', (req, res) => res.send(process.env.PAYPAL_CLIENT_ID))
         //console.log("Express products route added");
         // LogThis(log, `Setting the listener port 5000`, L0);
         // appStarter.listen(5000, () => {
         //   LogThis(log, "App started", L3);
         // });
         // LogThis(log, `listener port 5000 set`, L0);
         // LogThis(log, `Returning Promise of appStarter.listen`, L0);
         // return new Promise((resolve) => {
         //   // Start the server
         //   // const PORT = process.env.PORT || 3000;
         //   LogThis(log, `appStarter.listen Promise executed`, L0);
         //   const server = appStarter.listen(5000, () => {
         //     console.log(`Server is running on port ${5000}`);
         //     resolve(server);
         //   });
         // });
         const server = appStarter.listen(5000, () => {
            LogThis(log, `Server is running on port ${5000}`, L0)
            LogThis(log, `app value = ${appStarter}`, L0)

            resolve(appStarter) // Include both app and server in the resolve value
         })
      } catch (error) {
         LogThis(log, `Error during app start up: error=${error}`, L0)
         reject(error)
      }
   })
}

LogThis(logMain, `After invoking startApp async. Now about to export app`, L0)

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file

module.exports = {
   startApp,
}
