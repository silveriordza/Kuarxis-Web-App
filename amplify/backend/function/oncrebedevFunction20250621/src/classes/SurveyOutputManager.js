/** @format */

const { LogManager, L3 } = require('./LogManager.js')

const SurveyTemplateManager = require('./SurveyTemplateManager.js')

const sourceFilename = 'SurveyOutputManager.js'

class SurveyOutputManager extends SurveyTemplateManager {
   constructor(collectionName, identifierFieldName) {
      super(collectionName, identifierFieldName)

      this.log = new LogManager(sourceFilename, 'constructor')
      this.log.LogThis(`START`, L3)
   }

   createDynamicTableFromTemplate = async () => {
      //Start Output Collection

      const surveyOutputCollectionName =
         `surveyOutputs_${this.superSurveyShortName}`.toLocaleLowerCase()
      return await this.mongoDBManager.createDynamicCollectionFromFields(
         surveyOutputCollectionName,
         this.configs,
      )
   }

   async save(configs, linkField, linkValue, updateDynamicTable = true) {
      this.superSurveyShortName = linkValue[0].superSurveyShortName
      this.superSurveyId = linkValue[0]._id
      const collectionSaved = await super.save(
         configs,
         linkField,
         this.superSurveyId,
      )

      let dynamicTableCreated = false
      if (updateDynamicTable) {
         dynamicTableCreated = await this.createDynamicTableFromTemplate()
      }

      return {
         results: {
            colectionSaved: collectionSaved,
            dynamicTableCreated: dynamicTableCreated,
         },
      }
   }
}

module.exports = SurveyOutputManager
