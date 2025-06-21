/** @format */

const SurveyTemplateManager = require('./SurveyTemplateManager')
const { LogManager, L3 } = require('./LogManager.js')

const collectionName = 'Survey'
const identifierFieldName = '_id'
const sourceFilename = 'SurveyManager.js'

const surveyQuestionsComboFieldName = 'questions'
const questionsLinkField = 'surveyId'

const surveyCalculatedFieldsComboFieldName = 'calculatedFields'
const calculatedFieldsLinkField = 'surveyId'

class SurveyManager extends SurveyTemplateManager {
   constructor() {
      super(collectionName, identifierFieldName)
      this.log = new LogManager(sourceFilename, 'constructor')
      this.log.LogThis(`START`, L3)
      this.questionComboFieldsMap = null
      this.calcualtedFieldsComboFieldsMap = null

      this.sourceFilename = sourceFilename

      this.surveyQuestionsComboFieldName = surveyQuestionsComboFieldName
      this.questionsLinkField = questionsLinkField

      this.surveyCalculatedFieldsComboFieldName =
         surveyCalculatedFieldsComboFieldName
      this.calculatedFieldsLinkField = calculatedFieldsLinkField
   }

   addFieldToComboMap(mapObject) {
      mapObject.set('surveyShortName', 'surveyShortName')
      //This map is to include other fields from the Survey into the combined config and the format is (fieldName in combined object, field name in the Survey config (current object))
      mapObject.set('position', 'surveyPosition')
   }

   combineQuestionsConfig(questionsData) {
      this.questionComboFieldsMap = new Map()

      this.addFieldToComboMap(this.questionComboFieldsMap)

      super.combineSurveyElements(
         this.surveyQuestionsComboFieldName,
         questionsData,
         this.questionsLinkField,
         this.questionComboFieldsMap,
      )
   }

   combineCalculatedFieldsConfig(calculatedFieldsData) {
      this.calcualtedFieldsComboFieldsMap = new Map()

      this.addFieldToComboMap(this.calcualtedFieldsComboFieldsMap)

      super.combineSurveyElements(
         this.surveyCalculatedFieldsComboFieldName,
         calculatedFieldsData,
         this.calculatedFieldsLinkField,
         this.calcualtedFieldsComboFieldsMap,
      )
   }

   // combineMultiSurveysConfig(multiSurveys) {
   //    this.multiSurveysComboFieldsMap = new Map()

   //    this.addFieldToComboMap(this.multiSurveysComboFieldsMap)

   //    super.combineSurveyElements(
   //       this.surveyCalculatedFieldsComboFieldName,
   //       multiSurveys,
   //       this.calculatedFieldsLinkField,
   //       this.calcualtedFieldsComboFieldsMap,
   //    )
   // }
}

module.exports = SurveyManager
