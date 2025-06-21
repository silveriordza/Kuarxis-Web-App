const SurveyTemplateManager = require("./SurveyTemplateManager")
const { LogManager, L3} = require("./LogManager.js")

const collectionName = 'SurveyCalculatedField'
const identifierFieldName = '_id'
const sourceFilename = "SurveyCalculatedFieldManager.js"

class SurveyCalculatedFieldManager extends SurveyTemplateManager {
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

    

module.exports = SurveyCalculatedFieldManager