/** @format */

const mongoose = require('mongoose')
//const Schema = mongoose.Schema;
const { DynamicCollection } = require('../models/dynamicCollectionModel.js')

const {} = require('..')

let { LogThis, LoggerSettings, L0, L1, L2, L3 } = require('../utils/Logger.js')
const srcFileName = 'mongoDbHelper.js'

const dynamicModelsMap = {}

const convertDataTypeToMongoSchemaDataType = dataType => {
   switch (dataType) {
      case 'Date':
         return mongoose.Schema.Types.Date
      case 'String':
         return mongoose.Schema.Types.String
      case 'Integer':
         return mongoose.Schema.Types.Number
      case 'Number':
         return mongoose.Schema.Types.Number
      case 'Float':
         return mongoose.Schema.Types.Number
      default:
         throw Error(
            `Invalid output field dataType in fieldName ${column.fieldName} dataType:${column.dataType}`,
         )
   }
}

const getDynamicCollectionObject = async surveyShortName => {
   const surveyOutputCollectionName =
      `surveyOutputs_${surveyShortName}`.toLocaleLowerCase()

   const collections = await mongoose.connection.db
      .listCollections({ name: surveyOutputCollectionName })
      .toArray()
   const collInfo = collections.find(
      collection => collection.name === surveyOutputCollectionName,
   )
   if (collInfo) {
      let surveyOutputCollection = await mongoose.connection.collection(
         surveyOutputCollectionName,
      )
      return surveyOutputCollection
   }
   return null
}

const convertSchemaDefinitionToString = modelSchema => {
   const log = new LoggerSettings()
   log.fileName = srcFileName
   log.functionName = 'convertSchemaDefinitionToString'
   LogThis(log, `START modelSchema=${JSON.stringify(modelSchema)}`, L3)
   const schemaDefinitionAsString = Object.fromEntries(
      Object.entries(modelSchema).map(([key, type]) => [key, type.schemaName]),
   )
   LogThis(
      log,
      `schemaDefinitionAsString=${JSON.stringify(schemaDefinitionAsString)}`,
      L0,
   )
   return schemaDefinitionAsString
}
// Convert string types to real types
const convertSchemaFromStringToRealTypes = modelSchemaAsStrings => {
   const log = new LoggerSettings()
   log.fileName = srcFileName
   log.functionName = 'convertSchemaFromStringToRealTypes'
   LogThis(
      log,
      `START modelSchemaAsStrings=${JSON.stringify(
         modelSchemaAsStrings,
      )}; modelSchemaAsStrings.entries=${JSON.stringify(
         Object.entries(modelSchemaAsStrings),
      )}`,
      L3,
   )

   const modelSchemaReal = Object.fromEntries(
      Object.entries(modelSchemaAsStrings).map(([key, type]) => [key, String]),
   )
   // LogThis(
   //   log,
   //   `modelSchemaReal=${JSON.stringify(Object.entries(modelSchemaReal))}`,
   //   L3
   // );
   return modelSchemaReal
}

const saveDynamicModelToDB = async (modelName, modelSchema) => {
   const log = new LoggerSettings()
   log.fileName = srcFileName
   log.functionName = 'saveDynamicModelToDB'
   LogThis(log, `START modelSchema=${Object.entries(modelSchema)}`, L3)
   const schemaToString = convertSchemaDefinitionToString(modelSchema)
   LogThis(
      log,
      `schemaToString=${JSON.stringify(Object.entries(schemaToString))}`,
      L3,
   )

   await DynamicCollection.deleteOne({
      collectionName: modelName,
   })

   const dynamicCollection = new DynamicCollection()
   dynamicCollection.collectionName = modelName
   dynamicCollection.schemaDefinition = JSON.stringify(schemaToString)

   const createdDynamicCollection = await dynamicCollection.save()
   if (!createdDynamicCollection) {
      throw new Error(`DynamicCollection couldn't be created`)
   }
   return true
}

const loadDynamicModelsFromDB = async () => {
   const log = new LoggerSettings()
   log.fileName = srcFileName
   log.functionName = 'loadDynamicModelsFromDB'
   try {
      // Retrieve information about dynamic models from the database
      const dynamicModels = await DynamicCollection.find({})

      // Iterate through each dynamic model
      dynamicModels.forEach(dynamicModel => {
         const { collectionName, schemaDefinition } = dynamicModel
         // LogThis(
         //   log,
         //   `collectionName=${collectionName}; schemaDefinition=${schemaDefinition}`,
         //   L3
         // );
         let schemaParsed = JSON.parse(schemaDefinition)
         // LogThis(
         //   log,
         //   `collectionName=${collectionName}; schemaParsed=${JSON.stringify(
         //     schemaParsed
         //   )}`,
         //   L3
         // );
         // Convert string types to real types
         // const modelSchema = convertSchemaFromStringToRealTypes(schemaParsed);
         // LogThis(
         //   log,
         //   `Model schema string to real types: modelSchema=${JSON.stringify(
         //     Object.entries(modelSchema)
         //   )}`,
         //   L3
         // );
         // Create Mongoose model based on the retrieved schema
         // schemaObject = Object.fromEntries(
         //   Object.entries(schemaParsed).map(([key, value]) => [
         //     key,
         //     {
         //       type: String,
         //     },
         //   ])
         // );
         const schemaKeys = Object.keys(schemaParsed)
         let schemaObject = {}
         for (let i = 0; i < schemaKeys.length; i++) {
            let schemaType = null
            // switch (schemaParsed[schemaKeys[i]]) {
            //    case 'Date':
            //       schemaType = { type: mongoose.Schema.Types.Date }
            //       break
            //    default:
            //       schemaType = { type: mongoose.Schema.Types.String }
            // }
            schemaType = {
               type: convertDataTypeToMongoSchemaDataType(
                  schemaParsed[schemaKeys[i]],
               ),
            }
            schemaObject[schemaKeys[i]] = schemaType
            // LogThis(
            //   log,
            //   `schemaObject[${i}]=${JSON.stringify(
            //     typeof Object.entries(schemaObject[schemaKeys[i]])[0][1]
            //   )}`,
            //   L3
            // );
         }

         //LogThis(log, `schemaObject=${JSON.stringify(schemaObject)}`, L3);
         let dynamicSchema = mongoose.Schema(schemaObject)
         //LogThis(log, `dynamicSchema=${JSON.stringify(dynamicSchema)}`, L3);
         const modelLoaded = mongoose.model(collectionName, dynamicSchema)
         // LogThis(log, `1X`, L3);
         // LogThis(
         //   log,
         //   `Model loaded: modelLoaded=${JSON.stringify(modelLoaded)}`,
         //   L3
         // );

         dynamicModelsMap[collectionName] = modelLoaded

         // Now, you can use 'model' as a Mongoose model with the dynamically retrieved schema
         // LogThis(
         //   log,
         //   `Model for ${Object.entries(dynamicModelsMap)} created successfully.`,
         //   L3
         // );
      })

      const surveyOutputs = dynamicModelsMap['surveyoutputs_talentos_2020']
      //LogThis(log, `surveyOutputs=${JSON.stringify(surveyOutputs)}`, L3);
      // const listFound = await surveyOutputs.find({}).lean();
      // LogThis(log, `listFound=${JSON.stringify(listFound)}`, L3);
      // LogThis(
      //   log,
      //   `Models Map created successfully: dynamicModelsMap=${JSON.stringify(
      //     Object.entries(dynamicModelsMap)
      //   )} .`,
      //   L3
      // );
   } catch (error) {
      LogThis(
         log,
         `Error retrieving dynamic model information:, error=${error.message}`,
         L1,
      )
   }
}

const loadOneDynamicModelFromDB = async modelName => {
   const log = new LoggerSettings()
   log.fileName = srcFileName
   log.functionName = 'loadOneDynamicModelFromDB'
   const lowerCaseModel = modelName.toLocaleLowerCase()

   try {
      LogThis(log, `START modelName=${lowerCaseModel}`, L3)
      if (dynamicModelsMap.hasOwnProperty(lowerCaseModel)) {
         const existentModel = dynamicModelsMap[lowerCaseModel]

         LogThis(
            log,
            `returning existentModel=${JSON.stringify(existentModel)}`,
            L3,
         )
         return dynamicModelsMap[lowerCaseModel]
      }
      LogThis(log, `None existent model`, L3)
      //Retrieve information about dynamic models from the database

      //const lowerCaseModel = modelName.toLocaleLowerCase();
      const dynamicModel = await DynamicCollection.findOne({
         collectionName: lowerCaseModel,
      }).lean()
      //LogThis(log, `dynamicModel=${JSON.stringify(dynamicModel)}`, L3);
      if (dynamicModel) {
         const { collectionName, schemaDefinition } = dynamicModel
         const schemaRealTypes =
            convertSchemaFromStringToRealTypes(schemaDefinition)
         const modelFound = mongoose.model(collectionName, schemaRealTypes)
         dynamicModelsMap[collectionName] = modelFound
         // LogThis(
         //   log,
         //   `New Model added collectionName=${collectionName}; dynamicModelsMap=${JSON.stringify(
         //     Object.keys(dynamicModelsMap)
         //   )}`,
         //   L3
         // );
         return modelFound
      } else {
         LogThis(
            log,
            `DynamicModel ${lowerCaseModel} can't be loaded from DB`,
            L3,
         )
         throw new Error(
            `DynamicModel ${lowerCaseModel} can't be loaded from DB`,
         )
      }
   } catch (error) {
      LogThis(
         log,
         `Error retrieving dynamic model information:, error=${error.message}`,
      )
      throw error
   }
}

module.exports = {
   getDynamicCollectionObject,
   convertSchemaDefinitionToString,
   convertDataTypeToMongoSchemaDataType,
   saveDynamicModelToDB,
   loadDynamicModelsFromDB,
   loadOneDynamicModelFromDB,
   dynamicModelsMap,
}
