const TemplateManager = require("./TemplateManager")
const { LogManager, L3} = require("./LogManager.js")

const sourceFilename = "SurveyTemplateManager.js"

class SurveyTemplateManager extends TemplateManager {
    constructor(collectionName, identifierFieldName){
        super(    
            //configs,
            collectionName,
            identifierFieldName,
            //owner,
            )
            this.log = new LogManager (sourceFilename, "constructor")
            this.log.LogThis(`START`, L3)
        }
        async save(configs, linkField, linkValue){
            this.log.setFunctionName("Save")
            this.log.LogThis(`START`, L3)
            this.setOneToManyConstantLink(linkField, linkValue)
            this.configs=configs
            this.prepareOneToManyConstantTemplate()
            return await super.save()
        }

        async loadExistentFromMultis (surveyMultis, surveysFound){
            const identifierValue = []
            if(this.log.HasData(surveyMultis)){
         
                    for(const surveyMulti of surveyMultis){
                        if(!surveysFound?.some(surveyFound=> surveyFound.surveyShortName===surveyMulti.surveyShortName)){
                            identifierValue.push(surveyMulti.surveyShortName)
                        }
                    }
                
            }
            return await this.load(identifierValue)
        }
        
        async load(identifierValue){
            this.log.setFunctionName("load")
            this.filter = {}
            this.identifierValue = identifierValue

            this.filter[this.identifierFieldName]=identifierValue
            
            return await super.load(this.filter) 
        }

        async loadSortedAsc(identifierValue){
            this.log.setFunctionName("load")
            this.filter = {}
            this.identifierValue = identifierValue

            this.filter[this.identifierFieldName]=identifierValue
            
            return await super.loadSortedAsc(this.filter) 
        }

        async loadMatchList (matchListValues, matchField){
            this.log.setFunctionName("loadMatchList")
            this.log.HasDataMultipeEx("matchListValues, matchField", matchListValues, matchField)
            const matchValues = matchListValues.map(matchValue => matchValue[matchField])
            
            this.filter = {}
            this.identifierValues = matchValues
            this.filter[this.identifierFieldName]={$in: matchValues}
            return await super.load(this.filter)
        }

    }

module.exports = SurveyTemplateManager