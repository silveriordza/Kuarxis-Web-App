/** @format */

const SurveyTemplateManager = require('./SurveyTemplateManager')
const { LogManager, L3 } = require('./LogManager.js')

const collectionName = 'SurveySuperiorOutputLayout'
const identifierFieldName = 'surveySuperiorId'
const sourceFilename = 'SurveySuperiorOutputLayoutManager.js'

class SurveySuperiorOutputLayoutManager extends SurveyTemplateManager {
   constructor() {
      super(collectionName, identifierFieldName)
      this.log = new LogManager(sourceFilename, 'constructor')
      this.log.LogThis(`START`, L3)
   }
}

module.exports = SurveySuperiorOutputLayoutManager
