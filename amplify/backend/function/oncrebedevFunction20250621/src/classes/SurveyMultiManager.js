/** @format */

const SurveyTemplateManager = require('./SurveyTemplateManager')
const { LogManager, L3 } = require('./LogManager.js')

const collectionName = 'SurveyMulti'
const identifierFieldName = 'superSurveyId'
const sourceFilename = 'SurveyMultiManager.js'

const surveysComboFieldName = 'surveys'
const surveyLinkField = '_id'

class SurveyMultiManager extends SurveyTemplateManager {
   constructor() {
      super(collectionName, identifierFieldName)
      this.log = new LogManager(sourceFilename, 'constructor')
      this.log.LogThis(`START`, L3)
      this.surveysComboFieldsMap = null
      this.surveysComboFieldName = surveysComboFieldName
      this.surveyLinkField = surveyLinkField
   }

   addFieldToComboMap(mapObject) {
      mapObject.set('superSurveyId', 'superSurveyId')
      //This map is to include other fields from the Survey into the combined config and the format is (fieldName in combined object, field name in the Survey config (current object))
      mapObject.set('position', 'position')
      mapObject.set('monkeyPosition', 'monkeyInfo.position')
   }

   combineSurveys(surveys) {
      this.surveysComboFieldsMap = new Map()

      this.addFieldToComboMap(this.surveysComboFieldsMap)
      this.setIdentifierFieldName('surveyId')
      super.combineSurveyElements(
         this.surveysComboFieldName,
         surveys.getConfigsCombo(),
         this.surveyLinkField,
         this.surveysComboFieldsMap,
      )
   }

   getSurveysCombo() {
      this.surveys = this.getConfigsCombo()
         .map(config => config.surveys[0])
         .sort((surveyX, surveyY) => surveyX.position - surveyY.position)

      return this.surveys
   }
}

module.exports = SurveyMultiManager
