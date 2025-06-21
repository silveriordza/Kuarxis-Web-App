/** @format */

const TemplateManager = require('./TemplateManager')
const { LogManager, L3 } = require('./LogManager.js')
const { addPropertyMatchingValueInArray } = require('../utils/Functions.js')

const sourceFilename = 'SurveyFieldManager.js'

class SurveyFieldManager extends TemplateManager {
   constructor(
      collectionName,
      identifierFieldName,
      templateFieldToLink,
      referencedLinkField,
      linkedCollection,
      externalLinkField,
   ) {
      super(
         //configs,
         collectionName,
         identifierFieldName,
      )
      this.preProcessTemplate = this.preProcessTemplate.bind(this) // Bind A to the parent class
      this.log = new LogManager(sourceFilename, 'constructor')
      this.log.LogThis(`START`, L3)
      this.templateFieldToLink = templateFieldToLink
      this.referencedLinkField = referencedLinkField
      this.linkedCollection = linkedCollection
      this.externalLinkField = externalLinkField
   }

   //Updates the namesList in the parent TemplateMangaer based on specific function for the type of template.
   preProcessTemplate() {
      addPropertyMatchingValueInArray(
         this.configs,
         this.referencedLinkField,
         this.templateFieldToLink,
         this.externalLinkField,
         this.collectionToLink,
      )
   }

   async save(configs, collectionToLInk) {
      this.log.setFunctionName('save')
      this.configs = configs
      this.collectionToLink = collectionToLInk
      this.preProcessTemplate()
      //If I don't add the call like below with prototype and the name of the class, there was an issue because the child class of SurveyFieldManager is SurveyMiltiManager and both share the function preProcessTemplate with the same name and when the child invokes save of the parent then the parent was calling the child's preProcessTemplate if invoked form the parent with this.preProcessTemplate. To fix that I added theis explicit invokation.
      SurveyFieldManager.prototype.preProcessTemplate.call(this)
      return await super.save()
   }

   async saveManyToMany(configs, collectionToLInk) {
      this.log.setFunctionName('save')
      this.configs = configs
      this.collectionToLink = collectionToLInk
      this.preProcessTemplate()
      //If I don't add the call like below with prototype and the name of the class, there was an issue because the child class of SurveyFieldManager is SurveyMiltiManager and both share the function preProcessTemplate with the same name and when the child invokes save of the parent then the parent was calling the child's preProcessTemplate if invoked form the parent with this.preProcessTemplate. To fix that I added theis explicit invokation.
      SurveyFieldManager.prototype.preProcessTemplate.call(this)
      return await super.saveManyToMany()
   }
}

module.exports = SurveyFieldManager
