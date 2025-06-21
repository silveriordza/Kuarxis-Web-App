/** @format */

const {
   addPropertyValueInArray,
   cloneObject,
   insertValueInNestedObjectPath,
   insertValueInObjectPath,
} = require('../utils/Functions')
const { HasDataMultipeEx } = require('../utils/Logger')
const { LogManager, L0, L3, L1, L2 } = require('./LogManager')
const MongoDBManager = require('./MongoDBManager')

class TemplateManager {
   constructor(collectionName, identifierFieldName) {
      this.log = new LogManager('TemplateManager.js', 'constructor')
      this.log.LogThis(`START`, L3)

      this.mongoDBManager = new MongoDBManager(collectionName)

      //In case the template or survey object has links to other survey elements, the oneToManyLinkField is the name of the field that is linking and the oneToManyLinkValue is the value for which you want to find all the records that link the element with the other element.
      this.oneToManyLinkField = ''
      this.oneToManyLinkValue = ''

      this.manyToManyStaticField = ''
      this.manyToManyStaticValue = ''

      //configs is the template as it came from the JSON Template configuration file, or in case it came from the database, it is the lean version of the mongoDB collection objects.
      this.configs = null

      //configsCombined is whenever the template is linked to other elements, this variable will contain all those elements linked and combined on the same config. Example is: Survey has Questions, in this.config the original template config for the survey is maintained, but if the Survey is then combined with its questions, then the combined object Surveys plus Questions data will be stored in configsCombined.
      this.configsCombo = null

      //Thi sis the name of the collection as it is named in the mongoose model.
      this.collectionName = collectionName

      //The template configuration in MongoDb collection format as it came from mongoDB from a find or insertMany, or by assigning it directly using some Template function. This is always an array of collections even if the template object is only one.
      this.collection = null

      //Identifier fieldName is just the field from which you want to filter or find the template in the database.
      this.identifierFieldName = identifierFieldName

      //This is the list of identifiers (in case the collection has many elements, a list of ids of those elements will be created here)
      this.identifiersList = null
   }

   //This function will delete all templates that matches the list of identiiers this.identifiersList. This is useful when updating the templates configurations in the database, for example, deleting all questions from a Survey to then re-insert the questions with updated information.
   async deleteAllMatchingTemplates() {
      const log = this.log

      log.setFunctionName('deleteAllMatchingTemplates')

      const identifiersList = this.identifiersList

      log.HasData(identifiersList) || this.getIdentifiersList()

      log.HasDataMultipeEx(
         'collectionName,identifierFieldName, identifiersList',
         this.collectionName,
         this.identifierFieldName,
         this.identifiersList,
      )

      const result = await this.mongoDBManager.deleteManyWithCheck(
         this.identifierFieldName,
         this.identifiersList,
      )
      return result
   }

   async deleteManyToManyMatchingTemplates() {
      const log = this.log

      log.setFunctionName('deleteAllMatchingTemplates')

      //const identifiersList = this.identifiersList

      this.getIdentifiersManyToMany()

      log.HasDataMultipeEx(
         'collectionName,identifierFieldName, identifiersList',
         this.collectionName,
         this.manyToManyStaticField,
         this.identifiersList,
      )

      const result = await this.mongoDBManager.deleteManyWithCheck(
         this.manyToManyStaticField,
         this.identifiersList,
      )
      return result
   }
   //Updates the namesList in the parent TemplateMangaer based on specific function for the type of template.
   getIdentifiersList() {
      this.log.HasDataMultipeEx(
         'configs, identifierFieldName',
         this.configs,
         this.identifierFieldName,
      )

      this.identifiersList = this.configs.map(
         template => template[this.identifierFieldName],
      )
      return this.identifiersList
   }

   //Updates the namesList in the parent TemplateMangaer based on specific function for the type of template.
   getIdentifiersManyToMany() {
      this.log.HasDataMultipeEx(
         'configs, identifierFieldName',
         this.configs,
         this.manyToManyStaticField,
      )
      this.identifiersList = []
      for (const config of this.configs) {
         if (
            !this.identifiersList?.some(
               id => id === config[this.manyToManyStaticField],
            )
         ) {
            this.identifiersList.push(config[this.manyToManyStaticField])
         }
      }

      // this.identifiersList = this.configs.map(
      //    template => template[this.oneToManyLinkField],
      // )
      return this.identifiersList
   }

   setOneToManyConstantLink(oneToManyLinkField, oneToManyLinkValue) {
      this.oneToManyLinkField = oneToManyLinkField
      this.oneToManyLinkValue = oneToManyLinkValue
   }

   prepareOneToManyConstantTemplate() {
      this.log.HasDataMultipeEx(
         `configs, ${this.oneToManyLinkField}`,
         this.configs,
         this.oneToManyLinkValue,
      )
      addPropertyValueInArray(
         this.configs,
         this.oneToManyLinkField,
         this.oneToManyLinkValue,
      )
   }

   async save() {
      this.log.HasDataMultipeEx('configs', this.configs)

      await this.deleteAllMatchingTemplates()

      this.collection = await this.mongoDBManager.insertMany(this.configs)
      this.configs = this.mongoDBManager.leanCollectionList(this.collection)

      return this.configs
   }
   async saveManyToMany() {
      this.log.HasDataMultipeEx('configs', this.configs)

      await this.deleteManyToManyMatchingTemplates()

      this.collection = await this.mongoDBManager.insertMany(this.configs)
      this.configs = this.mongoDBManager.leanCollectionList(this.collection)

      return this.configs
   }

   //The load function receives a filter (which could be in any accepted mongoose filter format usually an object containing field and values{field: value}) or could be any other like {field: {$in: {val1, val2, val3}}} where val1, val2 and val3 could be an array of values.
   async load(filter) {
      this.collection = await this.mongoDBManager.findByFilter(filter)

      this.configs = this.mongoDBManager.leanCollectionList(this.collection)
      return this.configs
   }

   //The load function receives a filter (which could be in any accepted mongoose filter format usually an object containing field and values{field: value}) or could be any other like {field: {$in: {val1, val2, val3}}} where val1, val2 and val3 could be an array of values.
   async loadSortedAsc(filter) {
      this.collection = await this.mongoDBManager.findSortedAsc(filter)

      this.configs = this.mongoDBManager.leanCollectionList(this.collection)
      return this.configs
   }

   //This function creates a new this.configsCombo cloning the survey configs this.configs, but only the first time the this.configsCombo is created. if the conbigsCombo is already created, it will not modify it again.
   getOrCreateConfigsCombo() {
      if (!this.log.HasData(this.configsCombo)) {
         this.configsCombo = cloneObject(this.configs)
      }
   }

   combineSurveyElements(
      newFieldToAddInto,
      elemenetsToCombineFrom,
      fieldToLinkFrom,
      mapOtherFieldsInto = null,
   ) {
      this.log.HasDataMultipeEx(
         'newFieldToAddInto, elemenetsToCombineFrom, fieldToLinkFrom, configs',
         newFieldToAddInto,
         elemenetsToCombineFrom,
         fieldToLinkFrom,
         this.configs,
      )

      this.getOrCreateConfigsCombo()

      this.configsCombo.forEach(elementInto => {
         let newElementInto = elemenetsToCombineFrom.filter(elementFrom => {
            let result =
               elementInto[this.identifierFieldName].toString() ==
               elementFrom[fieldToLinkFrom].toString()
            this.log.LogVars(
               `list`,
               L3,
               `survey,into, from, condition`,
               elementInto.surveyShortName,
               elementInto[this.identifierFieldName],
               elementFrom[fieldToLinkFrom],
               elementInto[this.identifierFieldName].toString() ==
                  elementFrom[fieldToLinkFrom].toString(),
            )
            if (result && this.log.HasData(mapOtherFieldsInto)) {
               mapOtherFieldsInto.forEach((fieldFrom, fieldInto) => {
                  insertValueInObjectPath(
                     fieldFrom,
                     elementFrom,
                     elementInto[fieldInto],
                  )
                  //elementFrom[fieldFrom] = elementInto[fieldInto]
               })
            }
            return result
         })

         newElementInto = newElementInto
            .slice()
            .sort((a, b) => a.position - b.position)

         elementInto[newFieldToAddInto] = newElementInto
         return elementInto
      })
      //this.configsCombo = elementsToCombineInto
      return this.configsCombo
   }

   setIdentifierFieldName(identifierFieldName) {
      this.identifierFieldName = identifierFieldName
   }

   getConfigs() {
      return this.configs
   }
   getConfigsCombo() {
      this.getOrCreateConfigsCombo()
      return this.configsCombo
   }

   setConfigsCombo(configsCombo) {
      this.configsCombo = configsCombo
   }
}

module.exports = TemplateManager
