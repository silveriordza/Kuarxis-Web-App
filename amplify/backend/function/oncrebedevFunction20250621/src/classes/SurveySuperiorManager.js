const SurveyTemplateManager = require("./SurveyTemplateManager")
const { LogManager, L3} = require("./LogManager.js")

const collectionName = 'SurveySuperior'
const identifierFieldName = 'superSurveyShortName'
const sourceFilename = "SurveySuperiorManager.js"

const surveysComboFieldName = 'surveys'
const surveyLinkField = 'superSurveyId'

class SurveySuperiorManager extends SurveyTemplateManager {
    constructor(){
        super(    
            collectionName,
            identifierFieldName,
            )
            this.log = new LogManager (sourceFilename, "constructor")
            this.log.LogThis(`START`, L3)
            this.surveysComboFieldsMap = null
            this.surveysComboFieldName = surveysComboFieldName
            this.surveyLinkField = surveyLinkField

            // this.superSurveyMultiSurveyComboFieldName = superSurveyMultiSurveyComboFieldName
            // this.superSurveyMultiSurveyLinkField = superSurveyMultiSurveyLinkField
            // this.multiSurveyFieldComboMap=null


            // this.multiSurveyToSurveyComboMap
        }

        async load(identifierFieldValue){
            const result = await super.load(identifierFieldValue)
            this.log.HasDataException(result, `${collectionName} with id ${identifierFieldValue} was not found in KSS database`)
            return result[0]
        }

        addFieldToComboMap(mapObject) {
            mapObject.set('superSurveyShortName', 'superSurveyShortName')
            //This map is to include other fields from the Survey into the combined config and the format is (fieldName in combined object, field name in the Survey config (current object))
            mapObject.set('position', 'superSurveyPosition')
         }
      
         combineSurveys(surveys) {
            this.surveysComboFieldsMap = new Map()
      
            this.addFieldToComboMap(this.surveysComboFieldsMap)
            this.setIdentifierFieldName('_id')
            super.combineSurveyElements(
               this.surveysComboFieldName,
               surveys.getConfigsCombo(),
               this.surveyLinkField,
               this.surveysComboFieldsMap,
            )
         }
    }

module.exports = SurveySuperiorManager