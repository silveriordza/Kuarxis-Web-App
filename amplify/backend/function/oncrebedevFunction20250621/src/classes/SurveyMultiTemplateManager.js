const SurveyFieldManager = require("./SurveyFieldManager")
const { LogManager, L3} = require("./LogManager.js")
const { addPropertyMatchingValueInArray } = require("../utils/Functions.js")

const sourceFilename = "SurveyMultiTemplateManager.js"

class SurveyMultiTemplateManager extends SurveyFieldManager { 
    constructor(collectionName, identifierFieldName, templateFieldToLink, referencedLinkField, linkedCollection, externalLinkField, manyToManyStaticField){
        super(     
            collectionName, identifierFieldName, templateFieldToLink, referencedLinkField, linkedCollection, externalLinkField
            )
            this.manyToManyStaticField = manyToManyStaticField
            this.log = new LogManager (sourceFilename, "constructor")
            this.log.LogThis(`START`, L3)
            this.preProcessTemplate = this.preProcessTemplate.bind(this); // Bind A to  
        }
        
    
        
     //Updates the namesList in the parent TemplateMangaer based on specific function for the type of template.
    preProcessTemplate ()  {
        this.setOneToManyConstantLink(this.linkField, this.linkValue)
        this.prepareOneToManyConstantTemplate()
    }


    async save(configs, collectionToLInk, linkField, linkValue){
        this.log.setFunctionName('save')
        this.configs=configs
        this.linkField=linkField 
        this.linkValue=linkValue[0][this.externalLinkField]
        this.collectionToLink=collectionToLInk
        
        

        SurveyMultiTemplateManager.prototype.preProcessTemplate.call(this);
        return await super.saveManyToMany(this.configs, this.collectionToLink)
    }
    
}

module.exports = SurveyMultiTemplateManager