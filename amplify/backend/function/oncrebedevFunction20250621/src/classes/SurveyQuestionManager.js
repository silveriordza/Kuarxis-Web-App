const SurveyTemplateManager = require("./SurveyTemplateManager")
const { LogManager, L3} = require("./LogManager.js")

const collectionName = 'SurveyQuestion'
const identifierFieldName = '_id'
const sourceFilename = "SurveyQuestionManager.js"

class SurveyQuestionManager extends SurveyTemplateManager {
    constructor(){
        super(    
            collectionName,
            identifierFieldName,
            )
            this.log = new LogManager (sourceFilename, "constructor")
            this.log.LogThis(`START`, L3)
        }
        async loadMatchList (surveyToMach){
            this.setIdentifierFieldName("surveyId")
            return await super.loadMatchList(surveyToMach,"_id")
        }
    }

    

module.exports = SurveyQuestionManager