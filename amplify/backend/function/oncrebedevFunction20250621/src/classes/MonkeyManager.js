/** @format */

const axios = require('axios')

const { getSecretValue } = require('../awsServices/awsMiscellaneous.js')
let {
   SurveySuperior,
   // Survey,
   // SurveyQuestion,
   // SurveyCalculatedField,
   // SurveyCalculatedValue,
   // //SurveyMulti,
   // SurveySuperiorOutputLayout,
   // SurveyResponse,
   MonkeyConfig,
   //MonkeyNewResponse,
} = require('../models/surveysModel.js')
const {
   HasDataException,
   LoggerSettings,
   LogThis,
   j,
   HasData,
   // L0,
   // L1,
   // L2,
   L3,
} = require('../utils/Logger.js')

class MonkeyManager {
   constructor() {
      this.sourceFile = 'MonkeyManager.js'
      this.token = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

      if (!this.token || this.token == '') {
         throw new Error(`Survey Monkey token not found.`)
      }
      this.configMonkey = {
         //responseType: "arraybuffer",
         headers: {
            //"Content-Type": "multipart/form-data",
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
         },
      }
   }

   async getMonkeyConfigById(monkeyId) {
      const log = new LoggerSettings(this.sourceFile, 'getMonkeyConfigById')

      HasDataException(monkeyId, `Id must not be empty`, log)

      const result = await MonkeyConfig.findOne({
         id: monkeyId,
      }).lean()
      return result
   }

   async getMonkeyConfigBySurveyName(name) {
      const log = new LoggerSettings(
         this.sourceFile,
         'getMonkeyConfigBySurveyName',
      )

      HasDataException(name, `Name must not be empty`, log)

      const result = await MonkeyConfig.findOne({
         'survey.title': name,
      }).lean()
      return result
   }

   async getMonkeyConfigByIdorName(monkeyId, surveyName) {
      const log = new LoggerSettings(this.sourceFile, 'getMonkeyConfig')

      let monkeyConfigsResult = null

      if (!monkeyId || monkeyId === '') {
         monkeyConfigsResult = await this.getMonkeyConfigBySurveyName(
            surveyName,
         )
      } else {
         monkeyConfigsResult = await this.getMonkeyConfigById(monkeyId)
      }

      return monkeyConfigsResult
   }

   async getMonkeySurveysList() {
      const result = await axios.get(
         `https://api.surveymonkey.com/v3/surveys`,
         this.configMonkey,
      )
      const data = result.data.data
      LogThis(log, `data=${j(data)}`, L3)
      return data
   }

   async getMonkeySurveyDetails(monkeyId) {
      const log = new LoggerSettings(
         this.sourceFile,
         'getMonkeySurveyDetailsById',
      )
      HasDataException(monkeyId, `surveyId must not be empty`, log)
      const result = await axios.get(
         `https://api.surveymonkey.com/v3/surveys/${monkeyId}`,
         this.configMonkey,
      )

      const data = result.data
      LogThis(log, `data=${j(data)}`, L3)
      return data
   }

   async getMonkeySurveyPages(monkeyId) {
      const log = new LoggerSettings(
         this.sourceFile,
         'getMonkeySurveyDetailsById',
      )
      HasDataException(monkeyId, `monkeyId must not be empty`, log)
      const result = await axios.get(
         `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages`,
         this.configMonkey,
      )

      const data = result.data.data
      LogThis(log, `data=${j(data)}`, L3)
      return data
   }

   async getMonkeyPageQuestions(monkeyId, pageId) {
      const log = new LoggerSettings(this.sourceFile, 'getMonkeyPageQuestions')
      HasDataException(monkeyId, `monkeyId must not be empty`, log)
      const result = await axios.get(
         `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${pageId}/questions`,
         this.configMonkey,
      )
      const data = result.data.data
      LogThis(log, `data=${j(data)}`, L3)
      return data
   }
   async getMonkeyQuestionDetails(monkeyId, pageId, questionId) {
      const log = new LoggerSettings(
         this.sourceFile,
         'getMonkeySurveyDetailsById',
      )
      HasDataException(monkeyId, `surveyId must not be empty`, log)
      const result = await axios.get(
         `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${pageId}/questions/${questionId}`,
         this.configMonkey,
      )
      const data = result.data
      LogThis(log, `data=${j(data)}`, L3)
      return data
   }
   async saveMonkeyConfig(monkeyInfo) {
      const monkeyId = monkeyInfo.survey.id
      const survey = monkeyInfo.survey

      const monkeyConfig = new MonkeyConfig({
         monkeyId: monkeyId,
         survey: survey,
      })

      await MonkeyConfig.deleteOne({ monkeyId: monkeyId })
      const monkeyConfigSaved = await monkeyConfig.save()

      if (!monkeyConfigSaved) {
         throw new Error('Error saving Survey Monkey Config into database.')
      } else {
         return monkeyConfigSaved
      }
   }

   /**
    * - Given a surveyShortName (that already exists in SurveySuperior collection) it check if the SurveySuperior has a monkeyId, otherwise it gets it from Survey Monkey matching by the Survey Name in Survey Superior then updates the SurveySuperior with the monkeyId and returns the SurveySuperior object already updated. It also updates the SurveySuperior with in the database.
    * @param {*} surveyShortName
    * @returns - SurveySuperior updated with monkeyId
    */
   async updateMonkeyIdFromShortName(surveyShortName) {
      let superSurvey = await SurveySuperior.findOne({
         surveyShortName: surveyShortName,
      })
      if (superSurvey) {
         throw new Error(`Super surveyShortName value was not found`)
      }

      if (superSurvey.monkeyId == '') {
         //Start getting survey monkey configs
         // const surveysResult = await axios.get(
         //    `https://api.surveymonkey.com/v3/surveys`,
         //    this.configMonkey,
         // )
         // const surveys = surveysResult.data.data
         const surveys = await this.getMonkeySurveysList()

         const surveyFound = surveys.find(
            survey => survey.title == superSurvey.surveyName,
         )
         if (!surveyFound) {
            throw new Error('Survey not found.')
         } else {
            superSurvey.monkeyId = surveyFound.id
            superSurvey = await superSurvey.save()
         }
      }
      return superSurvey
   }

   async getConfigsFromMonkeyAndUpdateKSSB(monkeyIdIn) {
      const log = new LoggerSettings(
         this.sourceFile,
         'getConfigsFromMonkeyAndUpdateKSSById',
      )

      const surveyInfo = await this.getMonkeySurveyDetails(monkeyIdIn)
      HasDataException(
         surveyInfo,
         `Survey id was not found in Survey Monkey.`,
         log,
      )
      const monkeyInfo = { survey: {} }

      monkeyInfo.survey.title = surveyInfo.title
      monkeyInfo.survey.category = surveyInfo.category
      monkeyInfo.survey.question_count = surveyInfo.question_count
      monkeyInfo.survey.page_count = surveyInfo.page_count
      monkeyInfo.survey.date_created = surveyInfo.date_created
      monkeyInfo.survey.date_modified = surveyInfo.date_modified
      monkeyInfo.survey.id = surveyInfo.id

      const monkeyId = surveyInfo.id

      LogThis(log, `monkeyInfo=${j(monkeyInfo)}`, L3)
      const pages = await this.getMonkeySurveyPages(monkeyId)
      let page = null
      //LogThis(log, `pages=${j(pages)}`, L3)
      if (HasData(pages)) {
         for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            page = pages[pageIndex]
            //Start getting survey monkey configs
            // let questionsResult = await axios.get(
            //    `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions`,
            //    configMonkey,
            // )
            // let questions = questionsResult.data.data
            let questions = await this.getMonkeyPageQuestions(monkeyId, page.id)

            LogThis(log, `questions=${j(questions)}`, L3)
            if (!HasData(questions)) {
               continue
            }

            page.questions = questions

            for (
               let questionIndex = 0;
               questionIndex < questions.length;
               questionIndex++
            ) {
               let question = page.questions[questionIndex]

               // let questionDetailsResult = await axios.get(
               //    `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions/${question.id}`,
               //    configMonkey,
               // )

               // let questionDetails = questionDetailsResult.data
               const questionDetails = await this.getMonkeyQuestionDetails(
                  monkeyId,
                  page.id,
                  question.id,
               )

               LogThis(log, `questionDetails=${j(questionDetails)}`, L3)
               if (!HasData(questionDetails)) {
                  continue
               }
               question.details = questionDetails
            }
         }
         monkeyInfo.survey.pages = pages
      }
      LogThis(log, `monkeyInfo=${JSON.stringify(monkeyInfo, null, 2)}`, L3)
      const returnResult = await this.saveMonkeyConfig(monkeyInfo)
      return returnResult
   }
}

module.exports = MonkeyManager
