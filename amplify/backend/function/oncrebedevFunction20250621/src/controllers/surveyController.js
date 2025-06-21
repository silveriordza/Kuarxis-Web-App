/**
 * @format
 * @prittier
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema
//const util = require('util')
const axios = require('axios')
//const { getSecretValue } = require('../awsServices/awsMiscellaneous.js')
const MonkeyManager = require('../classes/MonkeyManager.js')
const SurveyProcessManager = require('../classes/SurveyProcessManager.js')
const webhookCompletedEventRequestTemplate = require('../config/monkeyConstants.json')

let asyncHandler = require('express-async-handler')

const { SURVEY_PROCESS_STATUS } = require('../config/surveyConstants.js')
const {
   applyStringCriteriaToValue,
   formatDate,
} = require('../utils/Functions.js')
const {
   getMonkeyResponses,
   ValidateMonkeyConfigs,
   PushBlankPage,
   AnalyzeQuestionResponse,
   AnalyzeQuestionResponseRedesign,
   GetWeightedResponse,
} = require('../utils/monkeyAPI.js')
const {
   buildOutputHeaders,
   //getSuperSurveysConfigs,
   //addResponseInfo,
   addResponseInfoAll,
   processCalculatedFields,
   surveySaveOutputRedesignedHelper,
} = require('../utils/surveysLib.js')

// let {
//   superSurveyConf,
// } = require("../models/otherModelsNotCode/surveyOnCareTreatmentTalentos2020.js");

let {
   SurveySuperior,
   Survey,
   SurveyQuestion,
   SurveyCalculatedField,
   SurveyCalculatedValue,
   SurveyMulti,
   SurveySuperiorOutputLayout,
   SurveyResponse,
   MonkeyConfig,
   MonkeyNewResponse,
   SurveyMonkeyIntegrated,
} = require('../models/surveysModel.js')

//let { DynamicCollection } = require('../models/dynamicCollectionModel.js')

let {
   LoggerSettings,
   LogThis,
   LogVars,
   HasDataException,
   LogDebugSection,
   LogVarsFilter,
   j,
   OFF,
   L0,
   L1,
   L2,
   L3,
} = require('../utils/Logger.js')

const archiver = require('archiver')
const AdmZip = require('adm-zip')
const JSZip = require('jszip')

let { rowCleaner } = require('../utils/csvProcessingLib.js')
let {
   saveDynamicModelToDB,
   loadOneDynamicModelFromDB,
   dynamicModelsMap,
   convertDataTypeToMongoSchemaDataType,
} = require('../utils/mongoDbHelper.js')
const srcFileName = 'surveyController.js'

const fs = require('fs')
const SurveyMonkeyIntegratedManager = require('../classes/SurveyMonkeyIntegratedManager.js')

const WEIGHTED_PAIRS = 'WEIGHTED_PAIRS'
const WEIGHTED_CRITERIA = 'WEIGHTED_CRITERIA'

const CAL_CONCAT_GROUP_BASED_ON_CRITERIA = 'CAL_CONCAT_GROUP_BASED_ON_CRITERIA'
const CAL_SUM_THE_GROUP = 'CAL_SUM_THE_GROUP'
const CAL_CRITERIA_ON_OTHER_FIELD = 'CAL_CRITERIA_ON_OTHER_FIELD'

//Constantas related to response auto processing and the MonkeyNewResponse collection process_status field.
const RESPONSE_PROCESSING_COMPLETE_SUCCEEDED =
   'RESPONSE_PROCESSING_COMPLETE_SUCCEEDED'
const RESPONSE_PROCESSING_COMPLETE_FAILED =
   'RESPONSE_PROCESSING_COMPLETE_SUCCEEDED'
const RESPONSE_PROCESSING_COMPLETE_NEW = 'RESPONSE_PROCESSING_COMPLETE_NEW'
const RESPONSE_PROCESSING_COMPLETE_UPDATED =
   'RESPONSE_PROCESSING_COMPLETE_UPDATED'

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const createSuperSurvey = asyncHandler(async (req, res) => {
   const functionName = 'getSuperSurveyConfigs'
   const log = new LoggerSettings(srcFileName, functionName)
   const superSurveyConfig = req.body
   let ownerId = req.user._id
   const updateDynamicTableInput = req.query?.updateDynamicTable || ''
   const updateDynamicTable =
      updateDynamicTableInput.toLocaleLowerCase() === 'yes' ? true : false

   const templateManager = new SurveyProcessManager()
   templateManager.activateTemplateSaver(
      superSurveyConfig,
      ownerId,
      updateDynamicTable,
   )
   const superSurveyTemplate = await templateManager.saveTemplate()

   console.log('about to respond')
   res.status(201).json({
      superSurveyTemplate: superSurveyTemplate,
      surveys: superSurveyTemplate.surveysResult,
      questions: superSurveyTemplate.questionsResult,
      calculatedFieldsResult: superSurveyTemplate.calculatedFieldsResult,
      outputLayoutsResult: superSurveyTemplate.outputLayoutsResult,

      // surveySuperiorId: createdSurveySuperior._id,
      // surveysCreated: surveysCreated,
      // questionsCreated: questionsCreated,
      // createdOutputLayout: createdOutputLayout,
      // surveyOutputCollectionSchema: surveyOutputCollectionSchema,
   })
})

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin

/**
 * @description This function merges the Super Survey configurations coming from the Super Survey JSON template, with the Survey Monkey configurations, and then seves the merged configs into the corresponding Survey Superior, Survey, Questions, CalculatedFields, Outputs and the SurveyOutputs (dynamic table)
 * @route - POST /surveys/surveymonkey
 * @access - Private/Admin
 * @param {*} req - req.body must have the Super Survey configuration template with all configs set there. req.user must be populated by the middleware at authentication.
 */
const superSurveyCreateConfigIntegratedWithMonkey = asyncHandler(
   async (req, res) => {
      const functionName = 'superSurveyCreateConfigIntegratedWithMonkey'
      const log = new LoggerSettings(srcFileName, functionName)
      //const { surveyConfigTemplate } = req.body
      //let ownerId = req.user._id
      //surveyConfigTemplate.owner = ownerId
      const superSurveyShortName = req.params.id

      // const monkeyToken = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

      // if (!monkeyToken || monkeyToken == '') {
      //    throw new Error(`Survey Monkey token not found.`)
      // }

      // const configMonkey = {
      //   //responseType: "arraybuffer",
      //   headers: {
      //     //"Content-Type": "multipart/form-data",
      //     Authorization: `Bearer ${monkeyToken}`,
      //     Accept: "application/json",
      //   },
      // };

      const surveyTemplateManager = new SurveyProcessManager()

      const superSurveyConfig =
         await surveyTemplateManager.integrateSurveyWithMonkey(
            superSurveyShortName,
         )

      res.status(201).json({
         superSurveyConfig: superSurveyConfig,
         // surveySuperiorId: createdSurveySuperior._id,
         // surveysCreated: surveysCreated,
         // questionsCreated: questionsCreated,
         // createdOutputLayout: createdOutputLayout,
         // surveyOutputCollectionSchema: surveyOutputCollectionSchema,
      })
   },
)

/**
 * @description This function merges the Super Survey configurations coming from the Super Survey JSON template, with the Survey Monkey configurations, and then seves the merged configs into the corresponding Survey Superior, Survey, Questions, CalculatedFields, Outputs and the SurveyOutputs (dynamic table)
 * @route - POST /surveys/surveymonkey
 * @access - Private/Admin
 * @param {*} req - req.body must have the Super Survey configuration template with all configs set there. req.user must be populated by the middleware at authentication.
 */
const createSurveys = asyncHandler(async (req, res) => {
   const functionName = 'superSurveyCreateConfigIntegratedWithMonkey'
   const log = new LoggerSettings(srcFileName, functionName)
   const { superSurveyConfig } = req.body
   let ownerId = req.user._id
   superSurveyConfig.owner = ownerId
   // const monkeyToken = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

   // if (!monkeyToken || monkeyToken == '') {
   //    throw new Error(`Survey Monkey token not found.`)
   // }

   // const configMonkey = {
   //   //responseType: "arraybuffer",
   //   headers: {
   //     //"Content-Type": "multipart/form-data",
   //     Authorization: `Bearer ${monkeyToken}`,
   //     Accept: "application/json",
   //   },
   // };

   const monkeyManager = new MonkeyManager()

   const result = await SurveySuperior.deleteOne({
      surveyShortName: superSurveyConfig.surveyShortName,
   })

   if (!result || !result.acknowledged) {
      throw new Error(
         `There was a problem attempting to delete a potentially existing survey for survey name: ${superSurveyConfig.surveyShortName}`,
      )
   }

   await SurveySuperior.deleteMany({})
   await Survey.deleteMany({})
   await SurveyQuestion.deleteMany({})
   await SurveyMulti.deleteMany({})
   await SurveyCalculatedField.deleteMany({})
   await SurveySuperiorOutputLayout.deleteMany({})

   // console.log("superSurveyConfig INPUT values are:");
   // console.log(superSurveyConfig);
   // console.log("Survey Configuration Values STRINGIFIED:");

   // if (
   //    superSurveyConfig.monkeyId &&
   //    superSurveyConfig.monkeyId == ''
   // ) {

   // }

   // const monkeyConfigsResult = await MonkeyConfig.find({
   //    //monkeyId: superSurveyConfig.monkeyId,
   //    'survey.title': superSurveyConfig.surveyName}
   // ).lean()

   // if (monkeyConfigsResult && monkeyConfigsResult.length <= 0) {
   //    throw new Error(
   //       `Survey does not exist in the cached Survey Monkey table`,
   //    )
   // }
   // const monkeyConfigs = monkeyConfigsResult[0]
   //Search in the MonkeyConfigs collection the config corresponding to this SuperSurvey config from the template. The Survey Monkey config must have already been created/updated using the path surveys/surveymonkey/:id where the id is the Survey Monkey Id for this survey in Survey Monkey, make sure to run that one first.
   const monkeyConfigs = await monkeyManager.getMonkeyConfigByIdorName(
      superSurveyConfig.monkeyId,
      superSurveyConfig.surveyName,
   )

   if (!monkeyConfigs) {
      throw new Error(
         `No Survey Monkey config found, run surveys/surveymonkey/:id first to download the corresponding Survey Monkey configs for this survey or verify the id or the name in your template matches in Survey Monkey by superSurveyConfig.id=${superSurveyConfig.id} or superSurveyConfig.name=${superSurveyConfig.name}`,
      )
   }

   //res.status(201).json(monkeyConfigs);
   //Save Survey Superior
   superSurveyConfig.monkeyId = monkeyConfigs.id
   const superSurvey = new SurveySuperior({
      owner: ownerId,
      surveyName: superSurveyConfig.surveyName,
      surveyShortName: superSurveyConfig.surveyShortName,
      description: superSurveyConfig.description,
      monkeyId: superSurveyConfig.monkeyId,
   })

   const createdSurveySuperior = await superSurvey.save()

   let surveysCreated = []
   let questionsCreated = []
   //let calculatedFieldsCreated = [];
   let surveyCreated = null
   let questions = []
   let calculatedFields = []
   let questionItem = null
   //let questionMonkeyPosition = null
   // LogThis(
   //   log,
   //   `monkeyConfigs=${JSON.stringify(monkeyConfigs)}`,
   //   L3
   // );
   let surveyResponse = superSurveyConfig.surveyList[0]
   let responseInfo = new Survey({
      superSurveyId: createdSurveySuperior._id,
      surveyName: surveyResponse.surveyName,
      surveyShortName: surveyResponse.surveyShortName,
      description: surveyResponse.description,
      instructions: surveyResponse.instructions,
      monkeyPosition: surveyResponse.monkeyPosition,
   })
   const responseInfoCreated = await responseInfo.save()

   // const responseInfoQuestions = []
   surveyResponse.questionList.forEach(
      question => (question.surveyId = responseInfoCreated._id),
   )

   const responseInfoQuestionsSaved = await SurveyQuestion.insertMany(
      surveyResponse.questionList,
   )

   for (let i = 1; i < superSurveyConfig.surveyList.length; i++) {
      let surveyItem = superSurveyConfig.surveyList[i]
      LogThis(
         log,
         `position=${
            surveyItem.monkeyPosition - 1
         }; surveyItem=${JSON.stringify(surveyItem, null, 1)}`,
         L3,
      )
      let monkeyItem = monkeyConfigs.survey.pages[surveyItem.monkeyPosition - 1]

      let survey = new Survey({
         superSurveyId: createdSurveySuperior._id,
         surveyName: surveyItem.surveyName,
         surveyShortName: surveyItem.surveyShortName,
         description: surveyItem.description,
         instructions: surveyItem.instructions,
         monkeyId: monkeyItem.id,
         monkeyPosition: surveyItem.monkeyPosition,
      })
      surveyCreated = await survey.save()

      surveysCreated.push(surveyCreated)

      let monkeyQuestions = monkeyItem.questions
      LogThis(
         log,
         `monkeyQuestions=${JSON.stringify(monkeyQuestions, null, 1)}`,
         L3,
      )

      for (let x = 0; x < surveyItem.questionList.length; x++) {
         questionItem = surveyItem.questionList[x]
         LogThis(
            log,
            `questionItem.monkeyPosition.position=${questionItem.monkeyPosition.position}`,
            L3,
         )

         let monkeyQuestionItem = monkeyQuestions.find(question => {
            LogThis(
               log,
               `questio.position=${question.position}; monkeyPosition=${
                  questionItem.monkeyPosition.position
               }; condition=${
                  question.position == questionItem.monkeyPosition.position
               }`,
               L3,
            )

            return question.position == questionItem.monkeyPosition.position
         })
         LogThis(
            log,
            `monkeyQuestionItem=${JSON.stringify(monkeyQuestionItem, null, 1)}`,
            L3,
         )
         if (!monkeyQuestionItem) {
            throw new Error(
               `Monkey Question Item not found for questionItem=${j(
                  questionItem,
               )}`,
            )
         }
         let monkeyQuestionDetails = monkeyQuestionItem.details
         let monkeyQuestionId = monkeyQuestionItem.id
         let family = monkeyQuestionDetails.family
         let subtype = monkeyQuestionDetails.subtype
         let monkeyQuestionAnswers = null
         let questionMonkeyPosition = null
         switch (family + '_' + subtype) {
            case 'open_ended_single':
               monkeyQuestionAnswers = {
                  answerField: 'text',
                  answerChoices: null,
               }
               break
            case 'single_choice_menu':
               questionMonkeyPosition = questionItem.monkeyPosition
               if (questionMonkeyPosition.answerType == 'other') {
                  monkeyQuestionAnswers = {
                     answerField: 'text',
                     answerChoices: {
                        id: monkeyQuestionDetails.answers.other.id,
                        value: monkeyQuestionDetails.answers.other.position,
                        realValue: '',
                        score: null,
                     },
                  }
               } else if (questionMonkeyPosition.answerType == 'noother') {
                  monkeyQuestionAnswers = {
                     answerField: 'choice_id',
                     answerChoices: monkeyQuestionDetails.answers.choices.map(
                        choice => {
                           return {
                              id: choice.id,
                              value: choice.position,
                              realValue: choice.text.trim(),
                              score: choice.quiz_options.score,
                           }
                        },
                     ),
                  }
               } else {
                  LogThis(
                     log,
                     `Survey monkey position answer type ${questionMonkeyPosition.answerType} is not valid.`,
                     L3,
                  )
                  throw new Error(
                     `Survey monkey position answer type ${questionMonkeyPosition.answerType} is not valid.`,
                  )
               }
               break
            case 'single_choice_vertical':
               questionMonkeyPosition = questionItem.monkeyPosition
               if (questionMonkeyPosition.answerType == 'other') {
                  monkeyQuestionAnswers = {
                     answerField: 'text',
                     answerChoices: {
                        id: monkeyQuestionDetails.answers.other.id,
                        value: monkeyQuestionDetails.answers.other.position,
                        realValue: '',
                        score: null,
                     },
                  }
               } else if (questionMonkeyPosition.answerType == 'noother') {
                  monkeyQuestionAnswers = {
                     answerField: 'choice_id',
                     answerChoices: monkeyQuestionDetails.answers.choices.map(
                        choice => {
                           return {
                              id: choice.id,
                              value: choice.position,
                              realValue: choice.text.trim(),
                              score: choice.quiz_options.score,
                           }
                        },
                     ),
                  }
               } else {
                  LogThis(
                     log,
                     `Survey monkey position type ${questionMonkeyPosition.answerType} is not valid.`,
                     L3,
                  )
                  throw new Error(
                     `Survey monkey position type ${questionMonkeyPosition.answerType} is not valid.`,
                  )
               }
               break
            case 'matrix_rating': // for creating survey from survey monkey
               {
                  let monkeyQuestion = monkeyQuestionDetails.answers.rows.find(
                     monkeyQuestion =>
                        questionItem.monkeyPosition.subPosition ==
                        monkeyQuestion.position,
                  )

                  if (!monkeyQuestion) {
                     LogThis(
                        log,
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                     throw new Error(
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                  }

                  monkeyQuestionId = monkeyQuestion.id

                  monkeyQuestionAnswers = {
                     answerField: 'choice_id',
                     answerChoices: monkeyQuestionDetails.answers.choices.map(
                        choice => {
                           return {
                              id: choice.id,
                              value: choice.position,
                              realValue: choice.text.trim(),
                              score: choice.weight,
                           }
                        },
                     ),
                  }
               }
               break
            case 'matrix_single':
               {
                  let monkeyQuestion = monkeyQuestionDetails.answers.rows.find(
                     monkeyQuestion =>
                        questionItem.monkeyPosition.subPosition ==
                        monkeyQuestion.position,
                  )

                  if (!monkeyQuestion) {
                     LogThis(
                        log,
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                     throw new Error(
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                  }

                  monkeyQuestionId = monkeyQuestion.id

                  monkeyQuestionAnswers = {
                     answerField: 'choice_id',
                     answerChoices: monkeyQuestionDetails.answers.choices.map(
                        choice => {
                           return {
                              id: choice.id,
                              value: choice.position,
                              realValue: choice.text.trim(),
                              score: 0,
                           }
                        },
                     ),
                  }
               }
               break

            case 'multiple_choice_vertical': // for creating survey from survey monkey
               {
                  let monkeyQuestion =
                     monkeyQuestionDetails.answers.choices.find(
                        monkeyQuestion =>
                           questionItem.monkeyPosition.subPosition ==
                           monkeyQuestion.position,
                     )

                  if (!monkeyQuestion) {
                     LogThis(
                        log,
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                     throw new Error(
                        `Question for field ${questionItem.fieldName} not found in Survey Monkey configs`,
                     )
                  }

                  monkeyQuestionId = monkeyQuestion.id

                  monkeyQuestionAnswers = {
                     answerField: 'choice_id',
                     answerChoices: [
                        {
                           id: monkeyQuestion.id,
                           value: monkeyQuestion.position,
                           realValue: monkeyQuestion.text.trim(),
                           score: monkeyQuestion.quiz_options.score,
                        },
                     ],
                  }
               }
               break
            default:
               LogThis(
                  log,
                  `Family:${family} and subType=${subtype} combination is not valid.`,
                  L3,
               )
               throw new Error(
                  `Family:${family} and subType=${subtype} combination is not valid.`,
               )
         }

         let newQuestion = {
            surveyId: surveyCreated._id,
            question: questionItem.question,
            questionShort: questionItem.questionShort,
            fieldName: questionItem.fieldName,
            weightType: questionItem.weightType,
            weights: questionItem.weights,
            position: questionItem.position,
            superSurveyCol: questionItem.superSurveyCol,
            monkeyId: monkeyQuestionId,
            monkeyPosition: questionItem.monkeyPosition,
            monkeyFamily: monkeyQuestionItem.details.family,
            monkeySubType: monkeyQuestionItem.details.subtype,
            monkeyAnswers: monkeyQuestionAnswers,
         }

         questions.push(newQuestion)
         LogThis(log, `questions=${JSON.stringify(questions, null, 2)}`, L3)
      }

      for (
         let x = 0;
         surveyItem.calculatedFieldList &&
         x < surveyItem.calculatedFieldList.length;
         x++
      ) {
         calculatedFieldItem = surveyItem.calculatedFieldList[x]
         calculatedFields
         calculatedFields.push({
            surveyId: surveyCreated._id,
            description: calculatedFieldItem.description,
            shortDescription: calculatedFieldItem.shortDescription,
            fieldName: calculatedFieldItem.fieldName,
            calculationType: calculatedFieldItem.calculationType,
            criteria: calculatedFieldItem.criteria ?? null,
            group: calculatedFieldItem.group,
            position: calculatedFieldItem.position,
         })
      }
      questionsCreated = await SurveyQuestion.insertMany(questions)
      questions = []
      if (calculatedFields.length > 0) {
         calculatedFieldsCreated = await SurveyCalculatedField.insertMany(
            calculatedFields,
         )
         calculatedFields = []
      }
   } //CLOSE SURVEY LOOP HERE

   let outputLayouts = superSurveyConfig.surveySuperiorOutputLayout.sort(
      (a, b) => a.position - b.position,
   )
   LogThis(log, `outputLayouts = ${JSON.stringify(outputLayouts)}`, L3)
   let outputLayoutFields = []
   for (let i = 0; i < outputLayouts.length; i++) {
      outputLayout = outputLayouts[i]
      outputLayoutFields.push({
         surveySuperiorId: createdSurveySuperior._id,
         surveyShortName: outputLayout.surveyShortName,
         fieldName: outputLayout.fieldName,
         outputAsReal: outputLayout.outputAsReal,
         dataType: outputLayout.dataType,
         showInSurveyOutputScreenScreen: outputLayout.showInSurveyOutputScreen,
         position: outputLayout.position,
      })
   }
   LogThis(
      log,
      `outputLayoutFields = ${JSON.stringify(outputLayoutFields)}`,
      L3,
   )
   const createdOutputLayout = await SurveySuperiorOutputLayout.insertMany(
      outputLayoutFields,
   )

   //Start Output Collection

   const surveyOutputCollectionName =
      `surveyOutputs_${superSurveyConfig.surveyShortName}`.toLocaleLowerCase()
   // LogThis(
   //    log,
   //    `x=${x}; surveyOutputCollectionName=${surveyOutputCollectionName}`,
   //    L3,
   // )
   const collections = await mongoose.connection.db
      .listCollections({ name: surveyOutputCollectionName })
      .toArray()
   const collInfo = collections.find(
      collection => collection.name === surveyOutputCollectionName,
   )
   if (collInfo) {
      LogThis(log, `dropping surveyOutputCollectionName`, L3)
      let surveyOutputCollection = await mongoose.connection.collection(
         surveyOutputCollectionName,
      )

      await surveyOutputCollection.drop()

      LogThis(log, `dropped surveyOutputCollectionName`, L3)

      delete mongoose.models[surveyOutputCollectionName]
      LogThis(log, `deleted models`, L3)
   }

   let surveyOutputColumns = {}

   outputLayoutFields.forEach(column => {
      LogThis(log, `output Layout Field column=${JSON.stringify(column)}`, L3)

      surveyOutputColumns[column.fieldName] =
         convertDataTypeToMongoSchemaDataType(column.dataType)

      // switch (column.dataType) {
      //    case 'INFO_3':
      //       surveyOutputColumns[column.fieldName] = mongoose.Schema.Types.Date
      //       break
      //    case 'INFO_4':
      //       surveyOutputColumns[column.fieldName] = mongoose.Schema.Types.Date
      //       break
      //    default:
      //       surveyOutputColumns[column.fieldName] = mongoose.Schema.Types.String
      // }
   })
   LogThis(
      log,
      `surveyOutputColumns=${j(Object.entries(surveyOutputColumns))}`,
      L3,
   )

   const surveyOutputCollectionSchema = new Schema(surveyOutputColumns)
   const surveyOutputCollection = mongoose.model(
      surveyOutputCollectionName,
      surveyOutputCollectionSchema,
   )

   saveDynamicModelToDB(surveyOutputCollectionName, surveyOutputColumns)

   res.status(201).json({
      surveySuperiorId: createdSurveySuperior._id,
      surveysCreated: surveysCreated,
      questionsCreated: questionsCreated,
      createdOutputLayout: createdOutputLayout,
      surveyOutputCollectionSchema: surveyOutputCollectionSchema,
   })
})

const testMonkey = asyncHandler(async (req, res) => {
   const functionName = 'superSurveyCreateConfig'
   const log = new LoggerSettings(srcFileName, functionName)
   const { superSurveyConfig } = req.body
   let ownerId = req.user._id
   const monkeyToken = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

   if (!monkeyToken || monkeyToken == '') {
      throw new Error(`Survey Monkey token not found.`)
   }

   const configMonkey = {
      //responseType: "arraybuffer",
      headers: {
         //"Content-Type": "multipart/form-data",
         Authorization: `Bearer ${monkeyToken}`,
         Accept: 'application/json',
      },
   }

   const surveysResult = await axios.get(
      `https://api.surveymonkey.com/v3/surveys`,
      configMonkey,
   )
   const surveys = surveysResult.data.data
   LogThis(log, `surveys=${JSON.stringify(surveys)}`, L3)

   res.status(201).json({
      surveys: surveys,
   })
})

const monkeyWebhookCreatedEvent = asyncHandler(async (req, res) => {
   const functionName = 'monkeyWebhookCreatedEvent'
   const log = new LoggerSettings(srcFileName, functionName)

   LogThis(log, `START`, L3)
   LogThis(log, `req.headers=${JSON.stringify(req.headers, null, 2)}`, L3)
   const bd = req.body
   LogThis(
      log,
      `name=${bd.name}; event_type=${bd.event_type}; object_id=${bd.object_id}`,
      L3,
   )

   LogThis(log, `resources=${JSON.stringify(bd.resources, null, 2)}`, L3)

   LogThis(log, `Event Happened`, L3)

   res.status(200).end()
})

const monkeyWebhookCompletedEventHelper = async req => {
   const functionName = 'monkeyWebhookCompletedEventHelper'
   const log = new LoggerSettings(srcFileName, functionName)

   try {
      LogThis(log, `START`, L0)
      LogThis(log, `req.headers = ${JSON.stringify(req.headers, null, 2)}`, L0)

      const bd = req.body

      // const bd = {
      //    name: 'webhookcompletedeventTalentos2020',
      //    filter_type: 'survey',
      //    filter_id: '182423261',
      //    event_type: 'response_completed',
      //    event_id: '10095505277',
      //    event_datetime: '2024-01-04T20:43:33.306289+00:00',
      //    object_type: 'response',
      //    object_id: '19130956913',
      //    resources: {
      //       respondent_id: '19130956913',
      //       recipient_id: '0',
      //       survey_id: '182423261',
      //       user_id: '74589357',
      //       collector_id: '259432991',
      //    },
      // }

      LogThis(
         log,
         `name=${bd.name}; event_type=${bd.event_type}; object_id=${bd.object_id}`,
         L0,
      )

      LogThis(log, `resources=${JSON.stringify(bd.resources, null, 2)}`, L0)
      const resources = bd.resources

      const superSurveyFound = await SurveySuperior.findOne({
         monkeyId: resources.survey_id,
      }).lean()

      if (!superSurveyFound) {
         throw new Error(
            `Monkey webhook: survey_id ${resources.survey_id} of respondent ${resources.respondent_id} not found`,
         )
      }
      LogThis(
         log,
         `superSurveyFound=${JSON.stringify(superSurveyFound, null, 1)}`,
         L0,
      )

      LogThis(
         log,
         `Saving new response trigger into database completed for respondent_id ${resources.respondent_id}`,
         L0,
      )
      LogThis(log, `Processing of monkeyUpdateResponses2Helper started`, L0)

      LogThis(log, `Processing of monkeyUpdateResponses2Helper started`, L0)
      const updateResponseRes = await monkeyUpdateResponses2Helper(req)
      LogThis(log, `Processing of monkeyUpdateResponses2Helper ended`, L0)

      return true
   } catch (error) {
      LogThis(log, `Error while processing webhook event ${req.body}`, L0)
      throw error
   }
}

const bulkMonkeyWebhookCompletedEventTalentosRedesign2020 = asyncHandler(
   async (req, res) => {
      const functionName = 'bulkMonkeyWebhookCompletedEventTalentosRedesign2020'
      const log = new LoggerSettings(srcFileName, functionName)

      try {
         LogThis(log, `START`, L0)
         //LogThis(log, `req.headers=${JSON.stringify(req.headers, null, 2)}`, L0)

         const respondentIdsList = req.body.respondentIdsList
         const surveyToBulk = req.body.surveyMonkeyId
         const reqWebhook = {}
         let result = null
         let respondentIdProcessed = []
         for (const respondentId of respondentIdsList) {
            webhookCompletedEventRequestTemplate.object_id = respondentId
            webhookCompletedEventRequestTemplate.resources.respondent_id =
               respondentId
            webhookCompletedEventRequestTemplate.filter_id = surveyToBulk
            webhookCompletedEventRequestTemplate.resources.survey_id =
               surveyToBulk
            reqWebhook.body = webhookCompletedEventRequestTemplate
            result = await monkeyUpdateResponses2RedesignHelper(reqWebhook)
            respondentIdProcessed.push(respondentId)
         }

         if (respondentIdProcessed) {
            //res.status(200).end()
            res.status(200).json({
               result: respondentIdProcessed,
            })
         } else {
            res.status(500).end()
         }

         //res.status(200).json({ updateResponseRes: updateResponseRes })
         //res.status(200).end()
      } catch (error) {
         LogThis(log, `Error found: ${error.message}`, L0)
         res.status(500).end()
      }
   },
)

const monkeyWebhookCompletedEventTalentosRedesign2020 = asyncHandler(
   async (req, res) => {
      const functionName = 'monkeyWebhookCompletedEventTalentosRedesign2020'
      const log = new LoggerSettings(srcFileName, functionName)

      try {
         LogThis(log, `START`, L0)
         //LogThis(log, `req.headers=${JSON.stringify(req.headers, null, 2)}`, L0)

         const result = await monkeyUpdateResponses2RedesignHelper(req)
         if (result) {
            //res.status(200).end()
            res.status(200).json({
               result: result,
            })
         } else {
            res.status(500).end()
         }

         //res.status(200).json({ updateResponseRes: updateResponseRes })
         //res.status(200).end()
      } catch (error) {
         LogThis(log, `Error found: ${error.message}`, L0)
         res.status(500).end()
      }
   },
)

const monkeyWebhookCompletedEventTalentos2020 = asyncHandler(
   async (req, res) => {
      const functionName = 'monkeyWebhookCompletedEventTalentos2020'
      const log = new LoggerSettings(srcFileName, functionName)

      try {
         LogThis(log, `START`, L0)
         LogThis(log, `req.headers=${JSON.stringify(req.headers, null, 2)}`, L0)

         const result = await monkeyUpdateResponses2Helper(req)
         if (result) {
            res.status(200).end()
         } else {
            res.status(500).end()
         }

         //res.status(200).json({ updateResponseRes: updateResponseRes })
         //res.status(200).end()
      } catch (error) {
         LogThis(log, `Error found: ${error.message}`, L0)
         res.status(500).end()
      }
   },
)

// const getMonkeyResponses = asyncHandler(async (req, res) => {
//    const functionName = 'updateMonkeyConfigs'
//    const log = new LoggerSettings(srcFileName, functionName)
//    //const { superSurveyConfig } = req.body;
//    //let ownerId = req.user._id;

//    //const paramTest = req.params.id;
//    const superSurveyId = req.params.id

//    LogThis(log, `START superSurveyId=${superSurveyId}`, L3)
//    const monkeyToken = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

//    if (!monkeyToken || monkeyToken == '') {
//       throw new Error(`Survey Monkey token not found.`)
//    }

//    const configMonkey = {
//       //responseType: "arraybuffer",
//       headers: {
//          //"Content-Type": "multipart/form-data",
//          Authorization: `Bearer ${monkeyToken}`,
//          Accept: 'application/json',
//       },
//    }

//    let superSurvey = await SurveySuperior.findOne({
//       surveySuperiorId: superSurveyId,
//    })

//    if (superSurvey.monkeyId == '') {
//       //Start getting survey monkey configs
//       const surveysResult = await axios.get(
//          `https://api.surveymonkey.com/v3/surveys`,
//          configMonkey,
//       )
//       const surveys = surveysResult.data.data
//       const surveyFound = surveys.find(
//          survey => survey.title == superSurvey.surveyName,
//       )
//       if (!surveyFound) {
//          throw new Error('Survey not found.')
//       } else {
//          superSurvey.monkeyId = surveyFound.id
//          superSurvey = await superSurvey.save()
//       }
//    }
//    const monkeyId = superSurvey.monkeyId

//    await MonkeyConfig.deleteOne({ monkeyId: monkeyId })

//    //Start getting survey monkey configs
//    const surveyInfoResult = await axios.get(
//       `https://api.surveymonkey.com/v3/surveys/${monkeyId}`,
//       configMonkey,
//    )

//    const surveyInfo = surveyInfoResult.data

//    const monkeyInfo = { survey: {} }

//    monkeyInfo.survey.title = surveyInfo.title
//    monkeyInfo.survey.category = surveyInfo.category
//    monkeyInfo.survey.question_count = surveyInfo.question_count
//    monkeyInfo.survey.page_count = surveyInfo.page_count
//    monkeyInfo.survey.date_created = surveyInfo.date_created
//    monkeyInfo.survey.date_modified = surveyInfo.date_modified
//    monkeyInfo.survey.id = surveyInfo.id

//    LogThis(
//       log,
//       `monkeyInfo=${JSON.stringify(monkeyInfo, null, 2)}`,
//       L3,
//    )

//    //Start getting survey monkey configs
//    const pagesResult = await axios.get(
//       `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages`,
//       configMonkey,
//    )

//    const pages = pagesResult.data.data

//    LogThis(log, `pages=${JSON.stringify(pages, null, 2)}`, L3)

//    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
//       page = pages[pageIndex]
//       //Start getting survey monkey configs
//       let questionsResult = await axios.get(
//          `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions`,
//          configMonkey,
//       )
//       let questions = questionsResult.data.data

//       LogThis(log, `questions=${JSON.stringify(questions, null, 2)}`, L3)
//       page.questions = questions

//       for (
//          let questionIndex = 0;
//          questionIndex < questions.length;
//          questionIndex++
//       ) {
//          let question = page.questions[questionIndex]

//          let questionDetailsResult = await axios.get(
//             `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions/${question.id}`,
//             configMonkey,
//          )

//          let questionDetails = questionDetailsResult.data

//          LogThis(
//             log,
//             `questionDetails=${JSON.stringify(questionDetails, null, 2)}`,
//             L3,
//          )
//          question.details = questionDetails
//       }
//    }

//    monkeyInfo.survey.pages = pages
//    const monkeyConfig = new MonkeyConfig({
//       superSurveyId: superSurveyId,
//       monkeyId: monkeyId,
//       survey: monkeyInfo.survey,
//    })

//    LogThis(
//       log,
//       `monkeyInfo=${JSON.stringify(monkeyInfo, null, 2)}`,
//       L3,
//    )

//    const monkeyConfigSaved = await monkeyConfig.save()
//    if (!monkeyConfigSaved) {
//       res.status(401).json({
//          monkeyInfo: monkeyInfo,
//       })
//       throw new Error('Error saving Survey Monkey Config into database.')
//    } else {
//       res.status(201).json({
//          monkeyInfo: monkeyInfo,
//       })
//    }
// })

/**
 * API PATH:
 * PUT /surveymonkey/:id
 * PRE-REQUISITES: Survey must already exist in the SurveySuperior collection, otherwise run the POST /surveys path function superSurveyCreateConfig first.
 * ACCESS: User logged in, and must have admin role.
 * - This function updates SurveySuperior with the monkeyId based on a surveyShortName passed
 * - It also get all the configs for the Survey, Pages, Questions and stores them in the MonkeyConfigs collection
 * - It will delete from the MonkeyConfigs collections if there is a survey there matching with the monkeyId and replace it with the updated confis
 * @param {*} req - req.params.id must have the surveyShortName.
 * @param {*} res
 */
const updateMonkeyConfigs = asyncHandler(async (req, res) => {
   const functionName = 'updateMonkeyConfigs'
   const log = new LoggerSettings(srcFileName, functionName)
   //const { superSurveyConfig } = req.body;
   //let ownerId = req.user._id;

   //const paramTest = req.params.id;
   const monkeyId = req.params.id
   //const surveyName = req.query.surveyName

   LogThis(log, `START monkeyId=${monkeyId}`, L3)
   // const monkeyToken = process.env.KUARSIS_SURVEY_MONKEY_TOKEN

   // if (!monkeyToken || monkeyToken == '') {
   //    throw new Error(`Survey Monkey token not found.`)
   // }

   // const configMonkey = {
   //    //responseType: "arraybuffer",
   //    headers: {
   //       //"Content-Type": "multipart/form-data",
   //       Authorization: `Bearer ${monkeyToken}`,
   //       Accept: 'application/json',
   //    },
   // }
   const monkeyManager = new MonkeyManager()

   // let superSurvey = await SurveySuperior.findOne({
   //    surveyShortName: surveyShortName,
   // })

   // if (superSurvey.monkeyId == '') {
   //    //Start getting survey monkey configs
   //    const surveysResult = await axios.get(
   //       `https://api.surveymonkey.com/v3/surveys`,
   //       configMonkey,
   //    )
   //    const surveys = surveysResult.data.data
   //    const surveyFound = surveys.find(
   //       survey => survey.title == superSurvey.surveyName,
   //    )
   //    if (!surveyFound) {
   //       throw new Error('Survey not found.')
   //    } else {
   //       superSurvey.monkeyId = surveyFound.id
   //       superSurvey = await superSurvey.save()
   //    }
   // }

   // const superSurvey =
   //    monkeyManager.getMonkeyConfigById(id)
   // const monkeyId = superSurvey.monkeyId

   //Start getting survey monkey configs
   // const surveyInfoResult = await axios.get(
   //    `https://api.surveymonkey.com/v3/surveys/${monkeyId}`,
   //    configMonkey,
   // )

   // const surveyInfo = surveyInfoResult.data

   // const monkeyInfo = { survey: {} }

   // monkeyInfo.survey.title = surveyInfo.title
   // monkeyInfo.survey.category = surveyInfo.category
   // monkeyInfo.survey.question_count = surveyInfo.question_count
   // monkeyInfo.survey.page_count = surveyInfo.page_count
   // monkeyInfo.survey.date_created = surveyInfo.date_created
   // monkeyInfo.survey.date_modified = surveyInfo.date_modified
   // monkeyInfo.survey.id = surveyInfo.id

   // LogThis(
   //    log,
   //    `monkeyInfo=${JSON.stringify(monkeyInfo, null, 2)}`,
   //    L3,
   // )

   // //Start getting survey monkey configs
   // const pagesResult = await axios.get(
   //    `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages`,
   //    configMonkey,
   // )

   // const pages = pagesResult.data.data

   //LogThis(log, `pages=${JSON.stringify(pages, null, 2)}`, L3)

   // for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
   //    page = pages[pageIndex]
   //    //Start getting survey monkey configs
   //    let questionsResult = await axios.get(
   //       `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions`,
   //       configMonkey,
   //    )
   //    let questions = questionsResult.data.data

   //    LogThis(log, `questions=${JSON.stringify(questions, null, 2)}`, L3)
   //    page.questions = questions

   //    for (
   //       let questionIndex = 0;
   //       questionIndex < questions.length;
   //       questionIndex++
   //    ) {
   //       let question = page.questions[questionIndex]

   //       let questionDetailsResult = await axios.get(
   //          `https://api.surveymonkey.com/v3/surveys/${monkeyId}/pages/${page.id}/questions/${question.id}`,
   //          configMonkey,
   //       )

   //       let questionDetails = questionDetailsResult.data

   //       LogThis(
   //          log,
   //          `questionDetails=${JSON.stringify(questionDetails, null, 2)}`,
   //          L3,
   //       )
   //       question.details = questionDetails
   //    }
   // }

   // monkeyInfo.survey.pages = pages
   // const monkeyConfig = new MonkeyConfig({
   //    monkeyId: monkeyId,
   //    survey: monkeyInfo.survey,
   // })

   // LogThis(
   //    log,
   //    `monkeyInfo=${JSON.stringify(monkeyInfo, null, 2)}`,
   //    L3,
   // )

   // await MonkeyConfig.deleteOne({ monkeyId: monkeyId })
   // const monkeyConfigSaved = await monkeyConfig.save()
   // if (!monkeyConfigSaved) {
   //    res.status(401).json({
   //       monkeyInfo: monkeyInfo,
   //    })
   //    throw new Error('Error saving Survey Monkey Config into database.')
   // } else {
   //    res.status(201).json({
   //       monkeyInfo: monkeyInfo,
   //    })
   // }
   const monkeyConfigSaved =
      await monkeyManager.getConfigsFromMonkeyAndUpdateKSSB(monkeyId)
   if (!monkeyConfigSaved) {
      res.status(401).json({
         monkeyConfig: monkeyConfigSaved,
      })
      throw new Error('Error saving Survey Monkey Config into database.')
   } else {
      res.status(201).json({
         monkeyInfo: monkeyConfigSaved,
      })
   }
})

// @desc    Upload Answers to a Super Survey
// @route   PUT /api/surveys/:id
// @access  Private/Admin
const superSurveyUploadAnswers = asyncHandler(async (req, res) => {
   try {
      const functionName = 'superSurveyUploadAnswers'
      const log = new LoggerSettings(srcFileName, functionName)

      LogThis(log, `START`)

      await SurveyResponse.deleteMany({})
      await SurveyCalculatedValue.deleteMany({})

      const superSurveyId = req.params.id
      LogThis(log, `superSurveyId=${superSurveyId}`, L3)
      const user = req.user
      //const owner = req.user._id;
      const owner = '62e551baf5c6b51f61e0ef93'

      // Access the uploaded file
      const fileDataZip = req.files['fileNumeric'][0]
      const fileDataRealZip = req.files['fileReal'][0]
      if (!fileDataZip) {
         throw Error('No fileNumeric received')
      }

      if (!fileDataRealZip) {
         throw Error('No fileReal received')
      }
      if (!fileDataZip.buffer) {
         throw Error('fileNumeric does not have buffer')
      }

      if (!fileDataRealZip.buffer) {
         throw Error('fileReal does not have buffer')
      }

      const zipNumeric = new AdmZip(fileDataZip.buffer)
      const zipReal = new AdmZip(fileDataRealZip.buffer)

      const fileData = zipNumeric.readFile('fileNumeric.csv').toString('utf8')
      const fileDataReal = zipReal.readFile('fileReal.csv').toString('utf8')

      if (!fileData) {
         throw Error('fileNumeric was not unzipped properly')
      }

      if (!fileDataReal) {
         throw Error('fileReal was not unzipped properly')
      }

      const answersData = fileData

      LogThis(log, `answersData=${answersData}`)

      const answersDataReal = fileDataReal
      LogThis(log, `answersDataReal=${answersDataReal}`)

      let answersRows = answersData.replace(/\r/g, '').split('\n')
      answersRows.shift()
      answersRows.shift()

      let answersRealRows = answersDataReal.replace(/\r/g, '').split('\n')
      answersRealRows.shift()
      answersRealRows.shift()

      //STARTING LOGIC TO SAVE ANSWERS TO DATABASE
      /**
       * Get the Super Survey and the list of its Surveys
       */
      //LogThis(log, `answerRows=${answersRows}`);
      console.log(`Getting multi surveys`)
      let multiSurveys = await SurveyMulti.find({
         superSurveyId: superSurveyId,
         owner: owner,
      })
         .select('surveyId position')
         .sort({ position: 1 })
         .lean()

      if (!multiSurveys) {
         res.status(404)
         throw new Error('Multi Surveys not found')
      }

      const surveyIdsList = []

      multiSurveys.map(multiSurveyItem => {
         surveyIdsList.push(multiSurveyItem.surveyId)
      })
      console.log(
         `Mapping multi surveys surveysIdsList=${JSON.stringify(
            surveyIdsList,
         )}`,
      )

      LogThis(log, `surveyIdsList=${surveyIdsList}`, L3)

      const questions = await SurveyQuestion.find({
         surveyId: { $in: surveyIdsList },
      })
         .populate('surveyId')
         .sort({ superSurveyCol: 1 })
         .lean()

      LogThis(log, `resultset questions=${JSON.stringify(questions)}`, L3)

      const calculatedFields = await SurveyCalculatedField.find({
         surveyId: { $in: surveyIdsList },
      })
         .populate('surveyId')
         .lean()

      LogThis(
         log,
         `Calculated Fields Found: calculatedFields=${JSON.stringify(
            calculatedFields,
         )};`,
      )

      const surveyResponses = []

      const calculatedValues = []

      let allSurveyQuestions = []
      let allCalculatedFields = []
      console.log(`Getting questions per survey`)
      surveyIdsList.map(surveyId => {
         let surveyQuestions = questions
            .filter(
               question =>
                  question.surveyId._id.toString() === surveyId.toString(),
            )
            .sort((a, b) => a.superSurveyCol - b.superSurveyCol)

         allSurveyQuestions = [...allSurveyQuestions, ...surveyQuestions]

         let surveyCalculatedFields = calculatedFields
            .filter(
               calculatedField =>
                  calculatedField.surveyId._id.toString() ===
                  surveyId.toString(),
            )
            .sort((a, b) => a.position - b.position)

         allCalculatedFields = [
            ...allCalculatedFields,
            ...surveyCalculatedFields,
         ]
      })

      LogThis(log, `calculatedFields=${JSON.stringify(allSurveyQuestions)};`)

      LogThis(
         log,
         `Filtered calculated fields allCalculatedFields=${JSON.stringify(
            allCalculatedFields,
         )};`,
      )

      let questionDesc = ''
      let questionShortDesc = ''
      let csv = ''
      console.log(`Mapping Questions`)
      questions.map(q => {
         questionDesc = questionDesc + q.question + ','
         questionShortDesc = questionShortDesc + q.questionShort + ','
      })

      allCalculatedFields.map(c => {
         questionDesc = questionDesc + c.description + ','
         questionShortDesc = questionShortDesc + c.shortDescription + ','
      })
      questionDesc = questionDesc.slice(0, -1)
      questionShortDesc = questionShortDesc.slice(0, -1)
      questionDesc = questionDesc + '\n'
      questionShortDesc = questionShortDesc + '\n'

      csv = csv + questionDesc + questionShortDesc

      let rowClean = ''
      let answers = []
      let respondentId = ''

      let rowRealClean = ''
      let answersReal = []
      //console.log(`Processing rows`);
      for (let r = 0; r < answersRows.length; r++) {
         //console.log(`Processing row ${r + 1}`);
         LogThis(
            log,
            `Processing Row r=${r}; allSurveyQuestions length=${allSurveyQuestions.length}`,
         )
         rowClean = rowCleaner(answersRows[r])
         answers = rowClean.split(',')

         rowRealClean = rowCleaner(answersRealRows[r])
         answersReal = rowRealClean.split(',')

         LogThis(log, `answers=${answers}`)
         if (answers[0] == '' || answers[0].trim() == '') {
            break
         }

         respondentId = answers[0].trim()
         let row = r + 1
         for (let a = 0; a < allSurveyQuestions.length; a++) {
            //LogThis(log, `processing question a=${a}`)
            // LogThis(
            //   log,
            //   `row=${row}; allSurveyQuestions[a]._id=${allSurveyQuestions[a]._id}; answers[a]=${answers[a]}`
            // );
            let surveyQuestion = allSurveyQuestions[a]
            // LogVarsFilter(
            //    log,
            //    `processing question`,
            //    a,
            //    305,
            //    L0,
            //    'surveyQuestion=',
            //    surveyQuestion,
            // )
            //transform the question answer value into the weighted answer for that Survey.
            let weightedResponse = null
            let response = null
            let isWeighted = null
            // LogThis(
            //   log,
            //   `surveyQuestion=${JSON.stringify(
            //     surveyQuestion
            //   )};surveyQuestion.weights=${JSON.stringify(surveyQuestion.weights)}`
            // );

            if (
               surveyQuestion.weights &&
               Object.keys(surveyQuestion.weights).length >
                  0 /*&& surveyQuestion.weights.length > 0*/
            ) {
               // LogThis(
               //   log,
               //   `weighting: answers[${a}]=${
               //     answers[a]
               //   };surveyQuestion.weights=${JSON.stringify(
               //     surveyQuestion.weights
               //   )}; weightedValue=${
               //     surveyQuestion.weights[
               //       answers[a].toString().trim().replace(/'\n'/g, "")
               //     ]
               //   }`
               // );
               let answerA = answers[a].toString().trim().replace(/'\n'/g, '')
               if (answerA == '') {
                  answerA = '0'
               }
               weightedResponse = surveyQuestion.weights[answerA]
               if (!weightedResponse) {
                  weightedResponse = '0'
               }
               response = answerA
               answers[a] = weightedResponse
               isWeighted = true
               LogThis(log, `final weight: answer=${weightedResponse}`)
            } else {
               let answerA = answers[a]
               if (answerA == '') {
                  answerA = '0'
               }
               response = answerA
               weightedResponse = answerA
               isWeighted = false
               LogThis(log, `no weighted: answer=${weightedResponse}`)
            }

            surveyResponses.push({
               questionId: surveyQuestion._id,
               respondentId: respondentId,
               row: row,
               col: a + 1,
               response: response,
               responseReal: answersReal[a],
               weightedResponse: weightedResponse,
               isWeighted: isWeighted,
            })

            if (isWeighted) {
               LogThis(
                  log,
                  `Adding csv weighted answer: weightedResponse=${weightedResponse}`,
               )
               weightedResponse = weightedResponse ?? ''
               csv = csv + weightedResponse.toString() + ','
            } else {
               csv = csv + response.toString() + ','
            }
         }

         LogThis(log, `surveyResponse cycle=${JSON.stringify(surveyResponses)}`)
         //console.log(`surveyResponses=${surveyResponses}`);

         for (let a = 0; a < allCalculatedFields.length; a++) {
            // LogThis(
            //   log,
            //   `row=${row}; allCalculatedFields[a]._id=${allCalculatedFields[a]._id}; answers[a]=${answers[a]}`
            // );
            LogThis(
               log,
               `row=${row}; allCalculatedFields[a]._id=${allCalculatedFields[a]._id}}`,
            )
            //let col = a + 1
            allCalculatedField = allCalculatedFields[a]
            let value = null
            if (allCalculatedField.isCriteria) {
               let criteria = allCalculatedField.criteria
               LogThis(
                  log,
                  `Criteria in Question: criteria=${JSON.stringify(criteria)}`,
               )
               let fieldNameValue = allCalculatedFields.find(calField => {
                  LogThis(log, `calField=${JSON.stringify(calField)}`)
                  return calField.fieldName == criteria.fieldNameValue[0]
               })
               LogThis(log, `fieldNameValue1=${JSON.stringify(fieldNameValue)}`)
               let position = fieldNameValue.position
               calValue = calculatedValues.find(
                  value => value.col == position && value.row == row,
               )
               LogThis(
                  log,
                  `About to get into case > calValue=${JSON.stringify(
                     calValue,
                  )}; criteria.operator=${JSON.stringify(criteria.operator)}`,
               )
               switch (criteria.operator) {
                  case '>':
                     LogThis(
                        log,
                        `Inside case: calValue.value=${calValue.value};criteria.value=${criteria.value};criteria.resultIfTrue=${criteria.resultIfTrue}`,
                     )
                     if (calValue.value > criteria.value) {
                        value = criteria.resultIfTrue
                        LogThis(log, `Creteria is true: value=${value}`)
                     } else {
                        value = criteria.resultIfFalse
                        LogThis(log, `Creteria is false: value=${value}`)
                     }
                     break
                  default:
                     value = null
                     LogThis(log, `Case entered default: value${value}`)
               }
            } else {
               // LogThis(
               //   log,
               //   `Field is not criteria: allCalculatedField=${JSON.stringify(
               //     allCalculatedField
               //   )}`
               // );

               let groups = allCalculatedField.group
               groups.map(group => {
                  // LogThis(
                  //   log,
                  //   ` row=${row}; col=${a + 1}; group=${group} answers[group]=${
                  //     answers[group]
                  //   }; parseInt(answers[group])=${parseInt(answers[group])}`
                  // );

                  value = value + parseInt(answers[group])
               })
            }
            LogThis(
               log,
               `Pushing value: calculatedFieldId=${
                  allCalculatedFields[a]._id
               }; row=${row};col=${a + 1}; value=${value}; `,
            )
            if (typeof value != 'number' || value == null || isNaN(value)) {
               value = -1000
            }
            calculatedValues.push({
               calculatedFieldId: allCalculatedFields[a]._id,
               respondentId: respondentId,
               row: row,
               col: a + 1,
               value: value,
            })
            csv = csv + value.toString() + ','
         }
         csv = csv.slice(0, -1)
         csv = csv + '\n'
      } //This bracket

      //LogThis(log, `surveyResponses=${JSON.stringify(surveyResponses)}`);
      LogThis(log, `Inserting responses`)
      const surveyResponseCreated = await SurveyResponse.insertMany(
         surveyResponses,
      )

      LogThis(log, `calculatedValues=${JSON.stringify(calculatedValues)}`)
      LogThis(log, `Inserting calculatedValues`)
      const surveyCalculatedValuesCreated =
         await SurveyCalculatedValue.insertMany(calculatedValues)

      const outputLayoutsResult = await SurveySuperiorOutputLayout.find({
         surveySuperiorId: superSurveyId,
      }).sort({ position: 1 })

      // // questions;
      // // calculatedFields;
      // // surveyResponses;
      // // calculatedValues;
      //LogThis(log, `outputLayoutsResult=${JSON.stringify(outputLayoutsResult)}`);
      LogThis(log, `buildOutputHeaders`)
      console.log(`Building output headers`)
      const outputLayout = buildOutputHeaders(
         questions,
         calculatedFields,
         outputLayoutsResult,
      )

      LogThis(log, `outputLayouts=${JSON.stringify(outputLayout)}`, L3)

      let csvLayout = ''
      let layout = null
      for (let o = 0; o < outputLayout.length - 1; o++) {
         layout = outputLayout[o]
         csvLayout = csvLayout + layout.description + ','
      }
      layout = outputLayout[outputLayout.length - 1]
      csvLayout = csvLayout + layout.description + '\n'

      for (let o = 0; o < outputLayout.length - 1; o++) {
         layout = outputLayout[o]
         csvLayout = csvLayout + layout.shortDescription + ','
      }
      layout = outputLayout[outputLayout.length - 1]
      csvLayout = csvLayout + layout.shortDescription + '\n'

      const cols = []
      console.log(`Mapping colummns to Layout`)
      for (let o = 0; o < outputLayout.length; o++) {
         layout = outputLayout[o]
         LogThis(
            log,
            `layout.fieldId=${layout.fieldId}; layout.isCalculated=${layout.isCalculated}`,
         )
         if (layout.isCalculated) {
            LogThis(log, `layout.isCalculated=${layout.isCalculated}`)
            cols.push(
               calculatedValues
                  .filter(val => val.calculatedFieldId == layout.fieldId)
                  .sort((a, b) => a.row - b.row),
            )
         } else {
            let responses = surveyResponses.filter(
               val => val.questionId == layout.fieldId,
            )
            //LogThis(log, `responsesFound = ${JSON.stringify(responses)}`);
            responses = responses.sort((a, b) => a.row - b.row)
            //LogThis(log, `responsesSorted = ${JSON.stringify(responses)}`);
            cols.push(responses)
         }
      }
      LogThis(
         log,
         `cols=${JSON.stringify(cols)}; outputLayout=${JSON.stringify(
            outputLayout,
         )}`,
      )

      //console.log(`cols=${JSON.stringify(cols)}`);
      let value = null
      LogThis(
         log,
         `cols Length=${cols.length}; rows length=${cols[0].length}; outputLayout Length=${outputLayout.length}`,
      )
      console.log(`Getting values for the columns in the layout`)
      for (let r = 0; r < cols[0].length; r++) {
         //LogThis(log, `Current Row length=${cols[r].length}`);
         for (let c = 0; c < cols.length - 1; c++) {
            layout = outputLayout[c]
            LogThis(log, `Processing Col=${c}; row=${r}`)
            //console.log(`Processing Col=${c}; row=${r}`);
            value = cols[c][r]
            LogThis(log, `value cycle=${JSON.stringify(value)}`)
            if (layout.outputAsReal) {
               value = value.responseReal
            } else {
               if ('isWeighted' in value) {
                  if (value.isWeighted) {
                     value = value.weightedResponse
                  } else {
                     value = value.response
                  }
               } else {
                  value = value.value
               }
            }

            if (value == null || value == undefined) {
               value = ''
            }
            LogThis(log, `value=${value}`)
            csvLayout = csvLayout + value + ','
         }
         LogThis(
            log,
            `Processing Last Col=${outputLayout.length - 1}; row=${r}`,
         )
         value = cols[outputLayout.length - 1][r]

         if (layout.outputAsReal) {
            value = value.responseReal
         } else {
            if ('isWeighted' in value) {
               if (value.isWeighted) {
                  value = value.weightedResponse
               } else {
                  value = value.response
               }
            } else {
               value = value.value
            }
         }

         if (value == null || value == undefined) {
            value = ''
         }
         LogThis(log, `value=${value}`)
         csvLayout = csvLayout + value + '\n'
      }
      console.log(`Output layout is ready`)

      if (!questions) {
         res.status(404)
         throw new Error('Questions not found')
      }
      //Form the CSV output file

      //ENDING LOGIC TO SAVE ANSWERS TO DATABASE
      // console.log(
      //   `csvLayout.length=${csvLayout.length}; csvLayout=${csvLayout} `
      // );
      if (csvLayout && csvLayout.length > 0) {
         //if (true) {
         // LogThis(log, `END`);
         // // res.status(200).json({
         // //   // owner: user._id,
         // //   // superSurveyId: superSurveyId,
         // //   // multiSurveys: multiSurveys,
         // //   // surveyIdsList: surveyIdsList,
         // //   // allSurveyQuestions: allSurveyQuestions,
         // //   // surveyResponseCreated: surveyResponseCreated,
         // //   // surveyCalculatedValuesCreated: surveyCalculatedValuesCreated,
         // //   // answerRowsLength: answersRows.length,
         // //   // //questions: questions,
         // //   // answersRows: answersRows,
         // //   csv: csv,
         // // });
         // //console.log(csv);
         // LogThis(log, `csvLayoutEnd=${csvLayout}`);
         // // LogThis(
         // //   log,
         // //   `superSurveyId=${superSurveyId}; surveyFields=${JSON.stringify(
         // //     surveyFields
         // //   )}`
         // // );
         // // res.writeHead(200, {
         // //   "Content-Type": "text/plain",
         // //   "Content-Length": Buffer.byteLength(csv),
         // // });
         // // res.write(csv);
         // // res.end();
         // // res.writeHead(200, {
         // //   "Content-Type": "text/plain",
         // //   "Content-Length": Buffer.byteLength(csvLayout),
         // // });
         // // //res.write("Data Numeric next: \n");
         // // res.write(csvLayout);
         // // // res.write("\nData Real next:\n");
         // // // res.write(fileDataReal);
         // // res.end();

         // //Returning zip file using archiver
         // res.setHeader("Content-Type", "application/zip");
         // res.setHeader(
         //   "Content-Disposition",
         //   'attachment; filename="OutputReport.zip"'
         // );
         // const archive = archiver("zip", {
         //   zlib: { level: 9 },
         // });
         // archive.append(csvLayout, { name: "OutputReport.csv" });
         // archive.pipe(res);
         // console.log(`About to send the zip file back to the client`);
         // archive.finalize();

         // //Returning zip file using AdmZip
         // const zip = new AdmZip();

         // zip.addFile("OutputReport.csv", Buffer.from(csvLayout, "utf8"));

         // const outputReport = zip.toBuffer();
         // res.setHeader("Content-Type", "application/zip");
         // res.setHeader(
         //   "Content-Disposition",
         //   'attachment; filename="OutputReport.zip"'
         // );
         // console.log(
         //   `About to return outputReport as Buffer outputReport=${outputReport}`
         // );
         // //const text = new TextDecoder().decode(outputReport);
         // //console.log(`outputReport=${text}`);
         // res.send(outputReport);

         // //Returning zip file using AdmZip octet-stream and encoding with base64
         // const zip = new AdmZip();
         // zip.addFile("OutputReport.csv", Buffer.from(csvLayout, "utf8"));

         // const outputReport = zip.toBuffer();

         // const binaryOutputReport = Buffer.from(outputReport, "utf8");
         // const outputReport64 = binaryOutputReport.toString("base64");
         // res.setHeader("Content-Type", "application/octet-stream");
         // res.setHeader(
         //   "Content-Disposition",
         //   'attachment; filename="OutputReport.bin"'
         // );
         // //res.setHeader("Content-Transfer-Encoding", "base64");

         // console.log(`About to log the outputReport base64`);
         // //const text = new TextDecoder().decode(outputReport64);
         // //console.log(`outputReport=${text}`);
         // res.status(200).send(Buffer.from(outputReport64, "base64"));

         //Return zip file as application/zip but encoding it as Base64 string
         const zip = new AdmZip()

         zip.addFile('OutputReport.csv', Buffer.from(csvLayout, 'utf8'))

         const zipBuffer = zip.toBuffer()

         console.log(
            `zipBuffer=${zipBuffer}; toStringBase64=${zipBuffer.toString(
               'base64',
            )}; toStringUtf8=${zipBuffer.toString('utf8')} `,
         )

         const zipStr64 = Buffer.from(zipBuffer).toString('base64')
         const zipBuffer64 = Buffer.from(zipStr64, 'base64')

         res.setHeader('Content-Type', 'application/zip')

         res.setHeader(
            'Content-Disposition',
            'attachment; filename="OutputReport.zip"',
         )

         res.status(200).send(zipBuffer64.toString('base64'))
      } else {
         throw new Error('csv file does not have any values')
      }
   } catch (error) {
      res.status(404)
      throw new Error(error)
   }
})

const superSurveyTests = asyncHandler(async (req, res) => {
   try {
      //Basics investigation

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader(
         'Content-Disposition',
         'attachment; filename="OutputReport.zip"',
      )
      //res.setHeader("Content-Transfer-Encoding", "base64");
      const str = 'A'
      console.log(`str=${str}`)

      const strBufferUtf8 = Buffer.from(str, 'utf8')

      console.log(
         `strBufferUtf8=${strBufferUtf8}; toStringBase64=${strBufferUtf8.toString(
            'base64',
         )}; toStringUtf8=${strBufferUtf8.toString('utf8')}`,
      )

      const strBase64 = Buffer.from(str).toString('base64')
      const strBufferBase64 = Buffer.from(strBase64, 'base64')

      console.log(
         `strBufferBase64=${strBufferBase64}; toStringBase64=${strBufferBase64.toString(
            'base64',
         )}; toStringUtf8=${strBufferBase64.toString('utf8')} `,
      )

      const strBinary = Buffer.from(str, 'binary')
      console.log(
         `strBinary=${strBinary}; toStringBase64=${strBinary.toString(
            'base64',
         )}; toStringUtf8=${strBinary.toString('utf8')} `,
      )

      const zip = new AdmZip()

      zip.addFile('OutputReport.csv', Buffer.from(str, 'utf8'))

      const zipBuffer = zip.toBuffer()

      console.log(
         `zipBuffer=${zipBuffer}; toStringBase64=${zipBuffer.toString(
            'base64',
         )}; toStringUtf8=${zipBuffer.toString('utf8')} `,
      )

      const zipStr64 = Buffer.from(zipBuffer).toString('base64')
      const zipBuffer64 = Buffer.from(zipStr64, 'base64')
      //str = Buffer.from(strBufferBase64, "base64").toString("utf-8");
      //console.log(`base64 decoded str=${str}`);
      res.status(200).send(zipBuffer64.toString('base64'))
   } catch (error) {
      throw new Error(error)
   }
})

const getSuperSurveyConfigsHelper = async (
   userIdentifierIn,
   superSurveyIdIn,
) => {
   const functionName = 'getSuperSurveyConfigsHelper'
   const log = new LoggerSettings(srcFileName, functionName)

   LogThis(log, `START BY user=${userIdentifierIn}`, L3)

   const superSurveyId = superSurveyIdIn
   LogThis(log, `superSurveyId=${superSurveyId}`, L3)
   //const user = req.user
   //const owner = req.user._id;
   //const owner = "62e551baf5c6b51f61e0ef93";

   console.log(`Getting multi surveys`)
   let multiSurveys = await Survey.find({
      superSurveyId: superSurveyId,
   })
      .sort({ monkeyPosition: 1 })
      .lean()

   if (!multiSurveys) {
      res.status(404)
      throw new Error('Multi Surveys not found')
   }

   const surveyIdsList = []

   multiSurveys.map(multiSurveyItem => {
      surveyIdsList.push(multiSurveyItem._id)
   })
   LogThis(
      log,
      `Mapping multi surveys surveysIdsList=${JSON.stringify(surveyIdsList)}`,
      L3,
   )

   LogThis(log, `surveyIdsList=${surveyIdsList}`, L3)

   const questions = await SurveyQuestion.find({
      surveyId: { $in: surveyIdsList },
   })
      .populate('surveyId')
      .sort({ superSurveyCol: 1 })
      .lean()
   //return questions.
   LogThis(log, `resultset questions=${JSON.stringify(questions)}`, L3)

   const calculatedFields = await SurveyCalculatedField.find({
      surveyId: { $in: surveyIdsList },
   })
      .populate('surveyId')
      .lean()
   //return calculatedFields
   LogThis(
      log,
      `Calculated Fields Found: calculatedFields=${JSON.stringify(
         calculatedFields,
      )};`,
      L3,
   )

   const outputLayoutsResult = await SurveySuperiorOutputLayout.find({
      surveySuperiorId: superSurveyId,
   }).sort({ position: 1 })
   LogThis(log, `buildOutputHeaders`)
   //co});nsole.log(`Building output headers`);

   const outputLayout = buildOutputHeaders(
      questions,
      calculatedFields,
      outputLayoutsResult,
   )

   LogThis(log, `outputLayouts=${JSON.stringify(outputLayout)}`, L3)

   return {
      multiSurveys: multiSurveys,
      surveyIdsList: surveyIdsList,
      questions: questions,
      calculatedFields: calculatedFields,
      outputLayout: outputLayout,
   }
}

const getSuperSurveyConfigs = asyncHandler(async (req, res) => {
   try {
      const functionName = 'getSuperSurveyConfigs'
      const log = new LoggerSettings(srcFileName, functionName)

      const superSurveyConfig = await getSuperSurveyConfigsHelper(
         req.user.email,
         req.params.id,
      )

      res.status(200).json({
         multiSurveys: superSurveyConfig.multiSurveys,
         surveyIdsList: superSurveyConfig.surveyIdsList,
         questions: superSurveyConfig.questions,
         calculatedFields: superSurveyConfig.calculatedFields,
         outputLayout: superSurveyConfig.outputLayout,
      })
   } catch (error) {
      res.status(404)
      throw new Error(error)
   }
})

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const superSurveyGetList = asyncHandler(async (req, res) => {
   try {
      const surveySuperiors = await SurveySuperior.find({})
         .sort({ position: 1 })
         .lean()

      res.status(200).json({ surveySuperiors: surveySuperiors })
   } catch (error) {
      res.status(404)
      throw new Error('Product not found ')
   }
})

/**
 *
 */
const surveySaveOutputHelper = async (
   superSurveyId,
   columnsNames,
   outputValues,
   isFromWebhook,
) => {
   const functionName = 'surveySaveOutputHelper'
   const log = new LoggerSettings(srcFileName, functionName)
   try {
      LogThis(
         log,
         `superSurveyId=${superSurveyId}; columnsNames=${JSON.stringify(
            columnsNames,
            null,
            2,
         )}; outputValues=${JSON.stringify(outputValues)}`,
         L3,
      )
      const surveySuperiors = await SurveySuperior.find({
         _id: superSurveyId,
      }).lean()
      let x = 0
      x = x + 1
      LogThis(
         log,
         `x=${x}; surveySuperiors=${JSON.stringify(surveySuperiors)}`,
         L3,
      )

      const surveyOutputCollectionName = `surveyOutputs_${surveySuperiors[0].surveyShortName}`

      //   const collections = await mongoose.connection.db
      //   .listCollections({ name: surveyOutputCollectionName })
      //   .toArray();
      // x = x + 1;
      // LogThis(log, `x=${x}`, L3);
      // const collInfo = collections.find(
      //   (collection) => collection.name === surveyOutputCollectionName
      // );

      //const surveyOutputs = mongoose.model(surveyOutputCollectionName);
      // let surveyOutputCollection = mongoose.connection.collection(
      //    surveyOutputCollectionName.toLocaleLowerCase(),
      // )

      let surveyOutputCollection = await loadOneDynamicModelFromDB(
         surveyOutputCollectionName,
      )
      // x = x + 1;
      // LogThis(log, `x=${x}`, L3);
      // await surveyOutputCollection.deleteMany({});
      x = x + 1
      LogThis(log, `x=${x}`, L3)
      const outputValueDocuments = []
      let dateTimeParts = []
      let dateValue = null
      outputValues.forEach(row => {
         let doc = {}
         columnsNames.forEach((column, index) => {
            switch (column) {
               case 'INFO_3':
                  if (isFromWebhook) {
                     doc[column] = formatDate(row[index])
                  } else {
                     dateTimeParts = row[index].split(/[\s/:\-]/)
                     dateValue = new Date(
                        dateTimeParts[2], // Year
                        dateTimeParts[0] - 1, // Month
                        dateTimeParts[1], // Day
                        dateTimeParts[3], // Hours
                        dateTimeParts[4], // Minutes)
                     )
                     doc[column] = dateValue.toISOString()
                  }
                  break
               case 'INFO_4':
                  if (isFromWebhook) {
                     doc[column] = formatDate(row[index])
                  } else {
                     dateTimeParts = row[index].split(/[\s/:\-]/)
                     dateValue = new Date(
                        dateTimeParts[2], // Year
                        dateTimeParts[0] - 1, // Month
                        dateTimeParts[1], // Day
                        dateTimeParts[3], // Hours
                        dateTimeParts[4], // Minutes)
                     )
                     doc[column] = dateValue
                  }
                  break
               default:
                  doc[column] = row[index]
            }
         })
         outputValueDocuments.push(doc)
         doc = {}
      })

      if (outputValueDocuments && outputValueDocuments.length > 0) {
         const respondentsFound = await surveyOutputCollection.find({
            INFO_1: {
               $in: outputValueDocuments.map(outputValue => {
                  LogThis(log, `respondent id = ${outputValue['INFO_1']}`, L0)
                  return outputValue['INFO_1']
               }),
            },
         })

         let outputNews = null
         if (respondentsFound && respondentsFound.length > 0) {
            const outputUpdates = outputValueDocuments.filter(doc =>
               respondentsFound.find(res => doc.INFO_1 === res.INFO_1),
            )
            outputUpdates[0].INFO_4

            for (let r = 0; r < respondentsFound.length; r++) {
               let respondentFound = respondentsFound[r]
               let outputUpdate = outputUpdates.find(
                  update => update.INFO_1 === respondentFound.INFO_1,
               )

               Object.keys(outputUpdate).forEach(key => {
                  respondentFound[key] = outputUpdate[key]
               })
               LogThis(
                  log,
                  `updating respondents response ${j(respondentFound.INFO_1)}`,
                  L0,
               )
               await respondentFound.save()
               LogThis(log, `updated respondents DONE.`, L0)
            }

            // const outputCollectionUpdated =
            //    await surveyOutputCollection.updateMany(
            //       {
            //          INFO_1: {
            //             $in: outputUpdates.map(outputUpdate => {
            //                LogThis(
            //                   log,
            //                   `scolInfoIdList=${outputUpdate.INFO_1}`,
            //                   L0,
            //                )
            //                return outputUpdate.INFO_1
            //             }),
            //          },
            //       },
            //       { $set: outputUpdates },
            //    )

            outputNews = outputValueDocuments.filter(
               doc => !respondentsFound.find(res => doc.INFO_1 === res.INFO_1),
            )
         } else {
            outputNews = outputValueDocuments
         }
         LogThis(log, `inserting new respondents ${j(outputNews)}`, L3)
         await surveyOutputCollection.insertMany(outputNews)
         LogThis(log, `respondents inserted new DONE.`, L3)
      }

      // let outputUpdates = outputValueDocuments.filter(out => respondentsFoundout.INFO_1)

      // if(respondentsFound && respondentsFound.length > 0){
      //    for (let res =0; res < respondentsFound.length; res++){
      //       let respondentFound = respondentsFound[res]
      //       let outputFound = outputValueDocuments.find(outputDoc => outputDoc.INFO_1 === respondentFound.INFO_1)
      //    }
      // }

      // LogThis(
      //   log,
      //   `outputValueDocuments=${JSON.stringify(outputValueDocuments)}`
      // );

      //await surveyOutputCollection.insertMany(outputValueDocuments)
   } catch (error) {
      LogThis(log, `error ocurred: ${error.message}`, L3)
      throw error
   }
}

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const superSurveySaveOutput = asyncHandler(async (req, res) => {
   const functionName = 'superSurveySaveOutput'
   const log = new LoggerSettings(srcFileName, functionName)
   try {
      LogThis(log, `START BY user=${req.user.email}`, L3)
      const { columnsNames, outputValues } = req.body

      const superSurveyId = req.params.id

      await surveySaveOutputHelper(
         superSurveyId,
         columnsNames,
         outputValues,
         false,
      )

      res.status(200).json({ surveyOutputStatus: 'success' })
   } catch (error) {
      res.status(404)
      LogThis(log, `error=${error.message}`, L3)
      throw new Error(`Survey Output Error: ${error.message}`)
   }
})

// const superSurveySaveOutputHelper = asyncHandler(async (req) => {
//    try {
//       LogThis(log, `START BY user=${req.user.email}`, L3)
//       const { columnsNames, outputValues } = req.body

//       const superSurveyId = req.params.id

//       await surveySaveOutputHelper(superSurveyId, columnsNames, outputValues)

//       res.status(200).json({ surveyOutputStatus: 'success' })
//    } catch (error) {
//       res.status(404)
//       LogThis(log, `error=${error.message}`, L3)
//       throw new Error(`Survey Output Error: ${error.message}`)
//    }
// })

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const superSurveyGetOutputValues = asyncHandler(async (req, res) => {
   const functionName = 'superSurveyGetOutputValues'
   const log = new LoggerSettings(srcFileName, functionName)
   try {
      LogThis(log, `START BY user=${req.user.email}`, L0)
      /**
       * On 12/7/23 I was working on the pagination and lookup by keyword
       * This function won't work without page beein provided by the client, the keyword is optional.
       */
      const pageSize = 100
      const superSurveyId = req.params.id
      const superSurveyShortName = req.query.superSurveyShortName
      const page = Number(req.query.pageNumber) || 1
      const keyword = req.query.keyword
      const dateRangeStartString = req.query.dateRangeStart || null
      const dateRangeEndString = req.query.dateRangeEnd || null

      //const regex = new RegExp(keyword, "i");
      const conditions = []
      let condition = {}
      //let fields = null;

      // const keyword = req.query.keyword
      //   ? {
      //       GENINFO_Nombre: {
      //         $regex: req.query.keyword,
      //         $options: "i",
      //       },
      //     }
      //   : {};

      LogThis(
         log,
         `superSurveyId=${superSurveyId};  superSurveyShortName=${JSON.stringify(
            superSurveyShortName,
         )}`,
         L3,
      )
      // const outputLayouts = await SurveySuperiorOutputLayout.find({
      //    surveySuperiorId: superSurveyId,
      // }).lean()

      const superSurvey = await SurveyMonkeyIntegrated.findOne({
         superSurveyId: superSurveyId,
      }).lean()

      const fieldsMap = new Map()

      for (const survey of superSurvey.surveyConfigs.surveys) {
         for (const field of survey.questions) {
            field.isCalculated = false
            fieldsMap.set(field.fieldName, field)
         }

         for (const field of survey.calculatedFields) {
            field.isCalculated = true
            fieldsMap.set(field.fieldName, field)
         }
      }

      const outputLayouts = superSurvey.surveyConfigs.outputLayouts
      for (const outputField of outputLayouts) {
         let field = null
         field = fieldsMap.get(outputField.fieldName)
         if (field.isCalculated) {
            outputField.question = field.description
            outputField.questionShort = field.shortDescription
         } else {
            outputField.question = field.question
            outputField.questionShort = field.questionShort
         }
      }

      let x = 0
      x = x + 1
      LogThis(log, `x=${x}; outputLayouts=${JSON.stringify(outputLayouts)}`, L3)
      let y = 0
      y = y + 1
      LogThis(log, `y=${y}`, L3)

      if (outputLayouts && outputLayouts.length > 0) {
         //fields = Object.keys(outputLayouts[0]);
         //LogThis(log, `fields=${JSON.stringify(fields)}`, L3);
         //const condition = {};
         if (keyword != '') {
            outputLayouts.forEach(field => {
               if (field.showInSurveyOutputScreen) {
                  if (field.dataType == 'String') {
                     condition[field.fieldName] = {
                        $regex: new RegExp(keyword.toString(), 'i'),
                     }
                     conditions.push(condition)
                  } else if (!isNaN(keyword)) {
                     switch (field.dataType) {
                        case 'Integer':
                           condition[field.fieldName] = parseInt(keyword ?? 0)
                           conditions.push(condition)
                           break
                        case 'Float':
                           condition[field.fieldName] = parseFloat(keyword ?? 0)
                           conditions.push(condition)
                           break
                        default:
                     }
                  }
                  condition = {}
               }
            })
         }

         //conditions.push(condition);
      }
      let conditionsObject = {}
      if (conditions && conditions.length > 0) {
         conditionsObject = { $or: conditions }
      }

      LogThis(log, `conditions=${JSON.stringify(conditions, null, 1)}`, L3)
      y = y + 1
      LogThis(log, `Before surveyOutputCollectionName y=${y}`, L3)
      const surveyOutputCollectionName = `surveyOutputs_${superSurveyShortName}`
      y = y + 1
      LogThis(log, `about to call loadOneDynamicModel... y=${y}`)
      let surveyOutputCollectionFound = await loadOneDynamicModelFromDB(
         surveyOutputCollectionName,
      )
      y = y + 1
      LogThis(log, `After calling loadOneDynamic y=${y}`, L3)
      y = y + 1
      LogThis(log, `About to call surveyOutputCollectionFound y=${y}`, L3)
      // const outputValuesFound = await surveyOutputCollectionFound
      //   .find({
      //     $or: [
      //       { GENINFO_Nombre: new RegExp(keyword, "i") },
      //       { GENINFO_Sexo: new RegExp(keyword, "i") },
      //     ],
      //   })
      //   .exec();
      let dateRangeStart = null
      let dateRangeEnd = null

      if (dateRangeStartString && dateRangeEndString) {
         dateRangeStart = new Date(dateRangeStartString)
         dateRangeEnd = new Date(dateRangeEndString)
         conditionsObject.$and = [
            {
               INFO_3: {
                  $gte: dateRangeStart,
                  $lte: dateRangeEnd,
               },
            },
         ]
      }

      const count = await surveyOutputCollectionFound.countDocuments(
         conditionsObject,
      )

      const outputValuesFound = await surveyOutputCollectionFound
         .find(conditionsObject, '-__v')
         .sort({ INFO_1: -1 })
         .limit(pageSize)
         .skip(pageSize * (page - 1))
         .lean()

      // y = y + 1;
      // LogThis(log, `Called surveyOutputCollectionFound y=${y}`, L3);

      // LogThis(
      //   log,
      //   `typeof surveyOutputCollectionFound=${typeof surveyOutputCollectionFound}; surveyOutputCollectionFound=${JSON.stringify(
      //     Object.entries(surveyOutputCollectionFound)
      //   )} `,
      //   L3
      // );
      // LogThis(
      //   log,
      //   `XdynamicModelMap=${JSON.stringify(Object.entries(dynamicModelsMap))}`,
      //   L3
      // );
      // const outputValuesFound = await dynamicModelsMap[
      //   "surveyoutputs_talentos_2020"
      // ].find({
      //   /*$or: conditions */
      // });

      LogThis(log, `outputValuesFound=${JSON.stringify(outputValuesFound)}`, L3)
      // let surveyOutputCollection = mongoose.connection.collection(
      //   surveyOutputCollectionName.toLocaleLowerCase()
      // );

      // const findAsync = util.promisify(
      //   surveyOutputCollection.find.bind(surveyOutputCollection)
      // );

      // const countDocumentsAsync = util.promisify(
      //   surveyOutputCollection.countDocuments.bind(surveyOutputCollection)
      // );

      // // const count = await countDocumentsAsync({})
      // // LogThis(log, `countDocuments count=${JSON.stringify(count)}`)

      // const queryoutputValues = await findAsync({ $or: conditions });
      // const outputValues = await queryoutputValues.toArray();
      // const count = outputValues.length;

      // findAsync;

      // x = x + 1
      // LogThis(log, `outputValues=${JSON.stringify(outputValuesFound)}`, L3)
      LogThis(
         log,
         `page=${page}; count=${count}; pages=${Math.ceil(count / pageSize)}`,
         L3,
      )
      res.status(200).json({
         outputsInfo: {
            outputLayouts: outputLayouts,
            outputValues: outputValuesFound,
            page,
            pages: Math.ceil(count / pageSize),
         },
      })
   } catch (error) {
      res.status(404)
      LogThis(log, `error=${error.message}`, L3)
      throw new Error(`Survey Output Error: ${error.message}`)
   }
})

const superSurveyDeleteOutputValues = asyncHandler(async (req, res) => {
   const functionName = 'superSurveyDeleteOutputValues'
   const log = new LoggerSettings(srcFileName, functionName)
   try {
      const superSurveyId = req.params.id

      LogThis(log, `superSurveyId=${superSurveyId}`, L3)
      LogThis(log, `Deleting 0`, L3)
      const surveySuperiors = await SurveySuperior.find({
         _id: superSurveyId,
      }).lean()

      const surveyOutputCollectionName = `surveyOutputs_${surveySuperiors[0].surveyShortName}`
      LogThis(log, `Deleting 1`, L3)
      let surveyOutputCollection = mongoose.connection.collection(
         surveyOutputCollectionName.toLocaleLowerCase(),
      )
      LogThis(log, `Deleting 2`, L3)
      await surveyOutputCollection.deleteMany()
      LogThis(log, `Deleting 3`, L3)
      res.status(204).end()
   } catch (error) {
      LogThis(
         log,
         `Error deleting output values survey=${surveySuperiors[0].surveyShortName}; error=${error.message}`,
      )
      res.status(404)
      throw new Error(
         `Error deleting output values survey=${surveySuperiors[0].surveyShortName}; error=${error.message}`,
      )
   }
})

// @desc    Creates a new Super Survey configuration
// @route   POST /api/surveys/
// @access  Private/Admin
const superSurveyGetRespondentIds = asyncHandler(async (req, res) => {
   const functionName = 'superSurveyGetRespondentIds'
   const log = new LoggerSettings(srcFileName, functionName)
   try {
      LogThis(log, `START BY user=${req.user.email}`, L3)
      /**
       * On 12/7/23 I was working on the pagination and lookup by keyword
       * This function won't work without page beein provided by the client, the keyword is optional.
       */
      const superSurveyShortName = req.params.id
      //const superSurveyShortName = req.query.superSurveyShortName;

      LogThis(log, `superSurveyShortName=${superSurveyShortName}`, L3)
      const surveyOutputCollectionName = `surveyOutputs_${superSurveyShortName}`

      let surveyOutputCollectionFound = await loadOneDynamicModelFromDB(
         surveyOutputCollectionName,
      )
      // LogThis(
      //   log,
      //   `surveyOutputCollectionFound=${surveyOutputCollectionFound}`,
      //   L3
      // );
      //await surveyOutputCollectionFound.deleteMany({});
      const respondentIdsInfo = await surveyOutputCollectionFound
         .find({})
         .select('INFO_1 INFO_3 INFO_4')
         .sort({ INFO_1: -1 })
         .lean()
      //LogThis(log, `respondentIdsInfo=${JSON.stringify(respondentIdsInfo)}`, L3);
      res.status(200).json({
         respondentIdsInfo: respondentIdsInfo,
      })
   } catch (error) {
      LogThis(
         log,
         `Error getting respondent ids error=${JSON.stringify(error)}`,
         L3,
      )
      res.status(404).json({ message: 'Error getting respondent ids error' })
      throw new Error(`Error getting respondent ids error=${error.message}`)
   }
})

const monkeyUpdateResponses2RedesignHelper = async req => {
   const functionName = 'monkeyUpdateResponses2RedesignHelper'
   const log = new LoggerSettings(srcFileName, functionName)
   let newRespondents = []
   let newResponseFound = null
   try {
      //const DEBUG_SECTION = 'RESPONSE_PROCESSING'
      //LogDebugSection(DEBUG_SECTION)
      //LogThis(log, `START BY user=${req.user.email}`, L3);
      /**
       * On 12/7/23 I was working on the pagination and lookup by keyword
       * This function won't work without page beein provided by the client, the keyword is optional.
       */
      const bd = req.body

      // LogThis(log, `resources=${JSON.stringify(bd.resources, null, 2)}`, L0)
      const resources = bd.resources

      newResponseFound = await MonkeyNewResponse.findOne({
         respondent_id: resources.respondent_id,
         monkeyId: resources.survey_id,
      })

      if (newResponseFound) {
         LogThis(
            log,
            `updating respondent ${resources.respondent_id}, status=${SURVEY_PROCESS_STATUS.UPDATED}`,
            L0,
         )
         newResponseFound.event_type = bd.event_type
         newResponseFound.event_datetime = bd.event_datetime
         newResponseFound.process_status = SURVEY_PROCESS_STATUS.UPDATED
      } else {
         LogThis(log, `creating respondent id ${resources.respondent_id}`, L0)
         LogThis(
            log,
            `resources.event_datetime=${
               bd.event_datetime
            }; date converted=${new Date(bd.event_datetime)}; status=${
               SURVEY_PROCESS_STATUS.NEW
            }`,
            L0,
         )
         newResponseFound = new MonkeyNewResponse({
            monkeyId: resources.survey_id,
            respondent_id: resources.respondent_id,
            event_type: bd.event_type,
            event_datetime: bd.event_datetime,
            process_status: SURVEY_PROCESS_STATUS.NEW,
         })
      }
      LogThis(
         log,
         `Saving new response trigger into database for respondent_id ${resources.respondent_id}`,
         L0,
      )
      newResponseFound = await newResponseFound.save()
      LogThis(
         log,
         `Saving new response trigger into database completed for respondent_id ${resources.respondent_id}`,
         L0,
      )

      const surveyConfigsObj = new SurveyMonkeyIntegratedManager()

      const surveyConfigs = await surveyConfigsObj.load(resources.survey_id)

      HasDataException(
         surveyConfigs,
         `surveyConfigs not found for ${resources.survey_id}`,
         log,
      )
      newResponseFound.process_status = SURVEY_PROCESS_STATUS.PROCESSING

      await newResponseFound.save()

      newRespondents.push(newResponseFound)
      const monkeyResponses = await getMonkeyResponses(newRespondents)
      superSurveysList = surveyConfigs[0]
      HasDataException(
         monkeyResponses,
         `Couldn't get responses from Survey Monkey ${superSurveysList.superSurveyShortName}`,
         log,
      )

      if (monkeyResponses.length != newRespondents.length) {
         throw new Error(
            `Number of responses from Survey Monkey are different from the count of new responses expected`,
         )
      }
      const superSurveyConfig = surveyConfigs[0].surveyConfigs
      const surveys = superSurveyConfig.surveys
      const monkeyPagesAnswersMap = monkeyResponses[0].surveyPagesMap
      const surveysAnswersMap = new Map()
      let fieldsAnswersMap = new Map()
      const subscaleToFieldsMap = new Map()
      let monkeyPageQuestions = null
      let monkeyPageAnswers = null
      let fieldName = null
      let weightedAnswers = null
      const allFieldsAnswersMap = new Map()
      allSurveysFieldsMap = new Map()

      for (const survey of surveys) {
         if (survey.surveyShortName === 'INFO') {
            fieldsAnswersMap = new Map()
            monkeyPageQuestions = monkeyPagesAnswersMap.get(
               survey.surveyShortName,
            )
            for (const question of survey.questions) {
               fieldName = question.fieldName
               let answer = null
               let finalAnswer = {}
               answer = monkeyPageQuestions.get(fieldName)

               finalAnswer.fieldName = fieldName
               finalAnswer.isCalculatedField = false
               finalAnswer.isWeighted = false
               finalAnswer.realValue = answer
               finalAnswer.score = 0
               finalAnswer.value = answer
               finalAnswer.weightedResponse = answer

               fieldsAnswersMap.set(fieldName, finalAnswer)
               allFieldsAnswersMap.set(fieldName, finalAnswer)
               allSurveysFieldsMap.set(fieldName, question)
            }
         } else {
            monkeyPageQuestions = monkeyPagesAnswersMap.get(
               survey.monkeyInfo.id,
            )
            fieldsAnswersMap = new Map()
            for (const question of survey.questions) {
               fieldName = question.fieldName
               //NEXT 222
               //if (question.monkeyInfo.type === 'MULTIPLE_CHOICE_VERTICAL') {
               monkeyPageAnswers = monkeyPageQuestions.get(
                  question.monkeyInfo.id,
               )
               // } else {
               //    monkeyPageAnswers = monkeyPageQuestions.get(
               //       question.monkeyInfo.monkeyAnswers.answerChoices[0].id,
               //    )
               // }
               let answer = null
               if (
                  monkeyPageAnswers &&
                  (question.monkeyInfo.type === 'MULTIPLE_CHOICE_VERTICAL' ||
                     question.monkeyInfo.type === 'SINGLE_CHOICE_VERTICAL' ||
                     question.monkeyInfo.type === 'SINGLE_CHOICE_MENU' ||
                     question.monkeyInfo.type ===
                        'MULTIPLE_CHOICE_VERTICAL_THREE_COL' ||
                     question.monkeyInfo.type ===
                        'SINGLE_CHOICE_VERTICAL_THREE_COL')
               ) {
                  for (const [key, monkeyPageAnswer] of monkeyPageAnswers) {
                     LogThis(
                        log,
                        `question.fieldName=${question.fieldName}; key=${key}`,
                        L3,
                     )
                     let choice_id = null
                     answer = null
                     if (monkeyPageAnswer.hasOwnProperty('other_id')) {
                        choice_id = monkeyPageAnswer.other_id
                     } else {
                        choice_id = monkeyPageAnswer.choice_id
                     }
                     answer =
                        question?.monkeyInfo?.monkeyAnswers?.answerChoices?.find(
                           choice => choice.id === choice_id,
                        )
                     if (answer) {
                        answer = monkeyPageAnswer
                        break
                     } else {
                        answer = null
                        //break
                     }
                  }
               } else {
                  answer = monkeyPageAnswers
               }

               //for (const [key, answer] of monkeyPageAnswers) {
               let monkeyAnswer = AnalyzeQuestionResponseRedesign(
                  question,
                  answer,
               )
               let weightedAnswer = GetWeightedResponse(question, monkeyAnswer)
               weightedAnswer.fieldName = fieldName
               weightedAnswer.isCalculatedField = false
               fieldsAnswersMap.set(fieldName, weightedAnswer)
               allFieldsAnswersMap.set(fieldName, weightedAnswer)

               if (subscaleToFieldsMap.has(question.subScale)) {
                  weightedAnswers = subscaleToFieldsMap.get(question.subScale)
                  weightedAnswers.push(weightedAnswer)
               } else {
                  weightedAnswers = []
                  weightedAnswers.push(weightedAnswer)
                  subscaleToFieldsMap.set(question.subScale, weightedAnswers)
               }
               allSurveysFieldsMap.set(fieldName, question)
            }

            for (const calculatedField of survey.calculatedFields) {
               let initialValue = {
                  isCalculatedField: true,
                  calculatedValue: 0,
               }
               fieldsAnswersMap.set(calculatedField.fieldName, initialValue)
               allFieldsAnswersMap.set(calculatedField.fieldName, initialValue)
               allSurveysFieldsMap.set(
                  calculatedField.fieldName,
                  calculatedField,
               )
            }
         }

         processCalculatedFields(survey, fieldsAnswersMap, subscaleToFieldsMap)
         surveysAnswersMap.set(survey.surveyShortName, fieldsAnswersMap)
      }

      const outputLayouts = superSurveyConfig.outputLayouts
      for (const outputField of outputLayouts) {
         outputField.processedAnswer = allFieldsAnswersMap.get(
            outputField.fieldName,
         )
         outputField.fieldInfo = allSurveysFieldsMap.get(outputField.fieldName)
      }

      let x = 1

      await surveySaveOutputRedesignedHelper(
         superSurveyConfig._id,
         outputLayouts,
         true,
      )

      newResponseFound.process_status = SURVEY_PROCESS_STATUS.PROCESSED

      await newResponseFound.save()

      return Array.from(surveysAnswersMap, ([survey, value]) => {
         let field = Array.from(value, ([name, answer]) => ({ name, answer }))
         return { survey, field }
      })
   } catch (error) {
      newResponseFound.process_status = SURVEY_PROCESS_STATUS.FAILED
      const result = await newResponseFound.save()
      throw new Error(
         `Error monkeyUpdateResponses2RedesignHelper error=${error.message}`,
      )
   }
}

const monkeyUpdateResponses2Helper = async req => {
   const functionName = 'monkeyUpdateResponses2Helper'
   const log = new LoggerSettings(srcFileName, functionName)
   let newRespondents = []
   let newResponseFound = null
   try {
      //const DEBUG_SECTION = 'RESPONSE_PROCESSING'
      //LogDebugSection(DEBUG_SECTION)
      //LogThis(log, `START BY user=${req.user.email}`, L3);
      /**
       * On 12/7/23 I was working on the pagination and lookup by keyword
       * This function won't work without page beein provided by the client, the keyword is optional.
       */
      const bd = req.body

      LogThis(log, `resources=${JSON.stringify(bd.resources, null, 2)}`, L0)
      const resources = bd.resources

      newResponseFound = await MonkeyNewResponse.findOne({
         respondent_id: resources.respondent_id,
         monkeyId: resources.survey_id,
      })

      if (newResponseFound) {
         LogThis(
            log,
            `updating respondent ${resources.respondent_id}, status=${SURVEY_PROCESS_STATUS.UPDATED}`,
            L0,
         )
         newResponseFound.event_type = bd.event_type
         newResponseFound.event_datetime = bd.event_datetime
         newResponseFound.process_status = SURVEY_PROCESS_STATUS.UPDATED
      } else {
         LogThis(log, `creating respondent id ${resources.respondent_id}`, L0)
         LogThis(
            log,
            `resources.event_datetime=${
               bd.event_datetime
            }; date converted=${new Date(bd.event_datetime)}; status=${
               SURVEY_PROCESS_STATUS.NEW
            }`,
            L0,
         )
         newResponseFound = new MonkeyNewResponse({
            monkeyId: resources.survey_id,
            respondent_id: resources.respondent_id,
            event_type: bd.event_type,
            event_datetime: bd.event_datetime,
            process_status: SURVEY_PROCESS_STATUS.NEW,
         })
      }
      LogThis(
         log,
         `Saving new response trigger into database for respondent_id ${resources.respondent_id}`,
         L0,
      )
      newResponseFound = await newResponseFound.save()
      LogThis(
         log,
         `Saving new response trigger into database completed for respondent_id ${resources.respondent_id}`,
         L0,
      )

      //    const surveyShortName = superSurveyFoundIn.surveyShortName
      const superSurveysList = await SurveySuperior.findOne({
         monkeyId: resources.survey_id,
      }).lean()

      HasDataException(
         superSurveysList,
         `Invalid super survey short name ${superSurveysList.surveyShortName}`,
         log,
      )

      // newRespondents = await MonkeyNewResponse.find({
      //    $and: [
      //       { monkeyId: superSurveysList.monkeyId },
      //       {
      //          $or: [
      //             { process_status: SURVEY_PROCESS_STATUS.NEW },
      //             { process_status: SURVEY_PROCESS_STATUS.UPDATED },
      //          ],
      //       },
      //    ],
      // })
      // LogThis(log, `newRespondents=${j(newRespondents)}`, L3)

      // if (!(newRespondents && newRespondents.length > 0)) {
      //    res.status(200).json({ message: 'No responses to process' })
      // }

      // const superSurveysArray = [superSurveysList];

      //let superSurveysConfigs = await getSuperSurveysConfigs(superSurveysArray);

      newRespondents.push(newResponseFound)
      const monkeyResponses = await getMonkeyResponses(newRespondents)

      HasDataException(
         monkeyResponses,
         `Couldn't get responses from Survey Monkey ${superSurveysList.surveyShortName}`,
         log,
      )

      if (monkeyResponses.length != newRespondents.length) {
         throw new Error(
            `Number of responses from Survey Monkey are different from the count of new responses expected`,
         )
      }

      const monkeyConfigs = await MonkeyConfig.findOne({
         monkeyId: superSurveysList.monkeyId,
      }).lean()

      //const surveyRows = [];
      const rowValue = []
      const rowReal = []
      const rowScore = []
      let colsValue = []
      let colsReal = []
      let colsScore = []

      monkeyResponses.forEach(r => {
         rowValue.push([])
         rowReal.push([])
         rowScore.push([])
      })

      ValidateMonkeyConfigs(monkeyConfigs, log)

      const monkeySurveyConf = monkeyConfigs.survey
      const monkeyPagesConf = monkeySurveyConf.pages

      for (
         let monkeyPageIndex = 0;
         monkeyPageIndex < monkeyPagesConf.length;
         //monkeyPageIndex < 19;
         monkeyPageIndex++
      ) {
         let monkeyPageConf = monkeyPagesConf[monkeyPageIndex]
         //LogThis(log, `page=${monkeyPageConf.title}`, DEBUG_SECTION)
         let monkeyQuestionsConf = monkeyPageConf.questions

         for (
            let monkeyQuestionIndex = 0;
            monkeyQuestionIndex < monkeyQuestionsConf.length;
            monkeyQuestionIndex++
         ) {
            let monkeyQuestionConf = monkeyQuestionsConf[monkeyQuestionIndex]
            //LogThis(log, `questions=${monkeyQuestionConf.id}`, DEBUG_SECTION)
            for (
               let respIndex = 0;
               respIndex < monkeyResponses.length;
               respIndex++
            ) {
               LogThis(log, `repIndex=${respIndex}`, L3)
               colsValue = rowValue[respIndex]
               colsReal = rowReal[respIndex]
               colsScore = rowScore[respIndex]

               let monkeyResponse = monkeyResponses[respIndex]

               //Only for the first page and first question the Response info will be added.
               if (monkeyPageIndex == 0 && monkeyQuestionIndex == 0) {
                  addResponseInfoAll(
                     colsValue,
                     colsReal,
                     colsScore,
                     monkeyResponse,
                  )
               }

               let monkeyResponsePage = monkeyResponse.pages.find(
                  responsePage => responsePage.id == monkeyPageConf.id,
               )
               // //if(!monkeyResponsePage){
               // if (!monkeyResponsePage) {
               //   const blankPageFill = PushBlankPage(
               //     colsValue,
               //     colsReal,
               //     colsScore,
               //     monkeyPageConf
               //   );
               //   rowValue[respIndex].concat(blankPageFill.colsValue);
               //   rowReal[respIndex].concat(blankPageFill.colsReal);
               //   rowScore[respIndex].concat(blankPageFill.colsScore);
               //   LogThis(log, `monkeyPage not found ${monkeyPageConf}`, L3);
               //   //LogVars(log, L3, `PushBlankPage values`, "rowValue, rowReal, rowScore", blankPageFill.rowValue, blankPageFill.rowReal, blankPageFill.rowScore)
               //   continue;
               // }
               //monkeyResponsePage = null
               let monkeyResponseQuestions = monkeyResponsePage?.questions
               let monkeyResponseQuestion = monkeyResponseQuestions?.find(
                  responseQuestion =>
                     responseQuestion.id == monkeyQuestionConf.id,
               )
               LogThis(
                  log,
                  `Testing ? parameter monkeyResponseQuestion = ${j(
                     monkeyResponseQuestion,
                  )}`,
                  L3,
               )

               if (
                  !(
                     monkeyQuestionConf.details.family == 'presentation' &&
                     monkeyQuestionConf.details.subtype == 'descriptive_text'
                  )
               ) {
                  LogThis(
                     log,
                     `monkeyQuestionConf=${j(
                        monkeyQuestionConf,
                     )}; monkeyResponseQuestion=${j(monkeyResponseQuestion)}`,
                     L0,
                  )
                  let responseValues = AnalyzeQuestionResponse(
                     monkeyQuestionConf,
                     monkeyResponseQuestion,
                  )

                  colsValue = colsValue.concat(responseValues.colsValue)
                  colsReal = colsReal.concat(responseValues.colsReal)
                  colsScore = colsScore.concat(responseValues.colsScore)
                  rowValue[respIndex] = colsValue
                  rowReal[respIndex] = colsReal
                  rowScore[respIndex] = colsScore
               }
            }
         }
      }

      // START OF PROCESSING THE SURVEY MONKEY ANSWERS INCLUDING CALCULATED FIELDS
      //let csvLayout = ''
      try {
         const fileNumeric = rowValue
         const fileReal = rowReal

         const surveySuperiorId = superSurveysList._id
         //const surveyShortName = survey.surveyShortName;
         const updateType = 'all'

         LogThis(
            log,
            `surveySuperiorId selected: surveySuperiorId=${surveySuperiorId}; surveyShortName=${superSurveysList.surveyShortName}`,
            L3,
         )

         if (fileNumeric && fileReal) {
            //   LogThis(log, "ABOUT TO CALL AXIOS");

            let answersRows = fileNumeric
            //   answersRows.shift();
            //   answersRows.shift();
            //   LogThis(log, `answersRows=${JSON.stringify(answersRows, null, 2)}`, L3);

            let answersRealRows = fileReal
            //   answersRealRows.shift();
            //   answersRealRows.shift();

            //   const results = await axios.get(
            //     BACKEND_ENDPOINT + `/surveys/${surveyShortName}/respondentidsinfo`,
            //     config
            //   );
            //   if (updateType == "new") {
            //     const respondentIdsInfo = results.data.respondentIdsInfo;
            //     LogThis(
            //       log,
            //       `respondentIdsInfo=${JSON.stringify(respondentIdsInfo, null, 2)}`,
            //       L3
            //     );
            //     dispatch({
            //       type: SURVEY_PROCESS_ANSWERS_STATUS,
            //       payload: {
            //         message: "Información de respuestas existentes obtenida.",
            //         row: 0,
            //       },
            //     });
            //     await new Promise((resolve) => setTimeout(resolve, 1));

            //     if (respondentIdsInfo && respondentIdsInfo.length > 0) {
            //       LogThis(log, `Filtering required`, L3);
            //       //START Filter rows by  new answers only

            //       let filteredAnswersRows = [];
            //       let filteredRealAnswersRows = [];
            //       const lastestIdSaved = respondentIdsInfo[0].INFO_1;

            //       const firstRow = rowCleaner2(answersRows[0]).split(",");
            //       if (firstRow[0] >= lastestIdSaved) {
            //         for (let i = 0; i < answersRows.length; i++) {
            //           let row = rowCleaner2(answersRows[i]).split(",");
            //           //if(row[0]>=lastestIdSaved){
            //           // if(!uploadingOldFile)
            //           // {
            //           if (row[0] == lastestIdSaved) {
            //             break;
            //           } else {
            //             filteredAnswersRows.push(answersRows[i]);
            //             filteredRealAnswersRows.push(answersRealRows[i]);
            //           }
            //           // } else {
            //           //   let resIdFound = answersRows.find(rowI => rowCleaner2(rowI).split(",")[0]==row[0])
            //           //   if(!resIdFound){
            //           //     filteredAnswersRows.push(answersRows[i]);
            //           //     filteredRealAnswersRows.push(answersRealRows[i]);
            //           //   }
            //           // }
            //         }
            //       } else {
            //         filteredAnswersRows = answersRows.filter(
            //           (row) =>
            //             !respondentIdsInfo.find(
            //               (respondentId) =>
            //                 respondentId.INFO_1 ==
            //                 rowCleaner2(row).split(",")[0]
            //             )
            //         );

            //         filteredRealAnswersRows = answersRealRows.filter((rowReal) =>
            //           filteredAnswersRows.find(
            //             (rowNum) =>
            //               rowCleaner2(rowReal).split(",")[0] ==
            //               rowCleaner2(rowNum).split(",")[0]
            //           )
            //         );
            //       }

            //       answersRows = filteredAnswersRows;

            //       LogThis(
            //         log,
            //         `Filtered answersData=${JSON.stringify(answersRows, null, 2)}`,
            //         L3
            //       );

            //       answersRealRows = filteredRealAnswersRows;
            //       LogThis(
            //         log,
            //         `Filtered answersDataReal=${JSON.stringify(
            //           answersRealRows,
            //           null,
            //           2
            //         )}`,
            //         L3
            //       );
            //     } else {
            //       LogThis(log, `Filtering not required`, L3);
            //     }
            //   } //end of if new

            if (
               answersRows &&
               answersRows.length > 0 &&
               //answersRows[0] != "" &&
               answersRealRows &&
               answersRealRows.length > 0 //&&
               //answersRealRows[0] != ""
            ) {
               LogThis(log, `answersRows files contains data`, L3)
               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: {
               //      message: "Obteniendo configuracion de las encuestas.",
               //      row: 0,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));
               //  let { data } = await axios.get(
               //    BACKEND_ENDPOINT + `/surveys/${surveySuperiorId}/configs`,
               //    config
               //  );
               const userId = 'MonkeyUser'

               const data = await getSuperSurveyConfigsHelper(
                  userId,
                  surveySuperiorId,
               )
               LogThis(log, `data=${JSON.stringify(data, null, 2)}`, L3)
               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: {
               //      message: "Configuracion de encuestas obtenido.",
               //      row: 0,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));

               const surveyConfigs = data

               //END Filter rows by  new answers only
               //console.log(`Getting multi surveys`);
               //GET MULTI SURVEY DATA HERE AND ASSIGN TO let multiSurveys
               //let multiSurvey = surveyConfigs.multiSurveys; // replace this with value from multiSurveys coming from response.
               const surveyIdsList = surveyConfigs.surveyIdsList

               //GET QUESTIONS FROM RESPONSE

               const questions = surveyConfigs.questions // replace with value from questions coming from response.

               //GET calculatedFields response
               const calculatedFields = surveyConfigs.calculatedFields

               LogThis(log, `surveyIdsList=${surveyIdsList}`)

               const surveyResponses = []

               const calculatedValues = []

               let allSurveyQuestions = []
               let allCalculatedFields = []
               //  console.log(`Getting questions per survey`);

               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: {
               //      message: "Mapeando las preguntas a cada tipo de encuesta.",
               //      row: 0,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));
               surveyIdsList.map(surveyId => {
                  let surveyQuestions = questions
                     .filter(
                        question =>
                           question.surveyId._id.toString() ===
                           surveyId.toString(),
                     )
                     .sort((a, b) => a.superSurveyCol - b.superSurveyCol)

                  surveyQuestions.forEach(q => {
                     allSurveyQuestions.push(q)
                  })

                  let surveyCalculatedFields = calculatedFields
                     .filter(
                        calculatedField =>
                           calculatedField.surveyId._id.toString() ===
                           surveyId.toString(),
                     )
                     .sort((a, b) => a.position - b.position)

                  surveyCalculatedFields.forEach(cal => {
                     allCalculatedFields.push(cal)
                  })
               })

               LogThis(
                  log,
                  `calculatedFields=${JSON.stringify(
                     allSurveyQuestions,
                     null,
                     2,
                  )};`,
               )

               LogThis(
                  log,
                  `Filtered calculated fields allCalculatedFields=${JSON.stringify(
                     allCalculatedFields,
                     null,
                     2,
                  )};`,
               )

               //  let questionDesc = "";
               //  let questionShortDesc = "";
               //  let csv = "";
               //  console.log(`Mapping Questions`);

               //  questions.map((q) => {
               //    questionDesc = questionDesc + q.question.replace(/,/g, ";") + ",";
               //    questionShortDesc =
               //      questionShortDesc + q.questionShort.replace(/,/g, ";") + ",";
               //  });

               //  allCalculatedFields.map((c) => {
               //    questionDesc =
               //      questionDesc + c.description.replace(/,/g, ";") + ",";
               //    questionShortDesc =
               //      questionShortDesc + c.shortDescription.replace(/,/g, ";") + ",";
               //  });
               //  questionDesc = questionDesc.slice(0, -1);
               //  questionShortDesc = questionShortDesc.slice(0, -1);
               //  questionDesc = questionDesc + "\n";
               //  questionShortDesc = questionShortDesc + "\n";

               //  csv = csv + questionDesc + questionShortDesc;

               //let rowClean = ''
               let answers = []
               let respondentId = ''

               //let rowRealClean = ''
               let answersReal = []
               //console.log(`Processing rows`);

               for (let r = 0; r < answersRows.length; r++) {
                  // if (r % 10 === 0) {
                  //   dispatch({
                  //     type: SURVEY_PROCESS_ANSWERS_STATUS,
                  //     payload: {
                  //       message: "Procesando respuestas para la encuesta número: ",
                  //       row: r + 1,
                  //     },
                  //   });
                  //   await new Promise((resolve) => setTimeout(resolve, 1));
                  // }
                  // LogThis(
                  //   log,
                  //   `Processing Row r=${r}; allSurveyQuestions=${JSON.stringify(
                  //     allSurveyQuestions,
                  //     null,
                  //     1
                  //   )} length=${allSurveyQuestions.length}`,
                  //   L3
                  // );
                  // rowClean = rowCleaner2(answersRows[r]);
                  // LogThis(
                  //   log,
                  //   `before calling split rowClean 1 rowClean=${JSON.stringify(
                  //     rowClean
                  //   )}`,
                  //   L3
                  // );
                  answers = answersRows[r]
                  // LogThis(
                  //   log,
                  //   `before calling split rowClean 2 answers=${JSON.stringify(
                  //     answers
                  //   )}`,
                  //   L3
                  // );
                  // rowRealClean = rowCleaner2(answersRealRows[r]);
                  // LogThis(
                  //   log,
                  //   `before calling split rowClean 3 rowRealClean=${JSON.stringify(
                  //     rowRealClean
                  //   )}`,
                  //   L3
                  // );
                  answersReal = answersRealRows[r]
                  // LogThis(
                  //   log,
                  //   `before calling split rowClean 4 answersReal=${JSON.stringify(
                  //     answersReal
                  //   )}`,
                  //   L3
                  // );

                  LogThis(log, `answers=${answers}`, L3)
                  if (answers[0] == '' || answers[0].trim() == '') {
                     break
                  }

                  respondentId = answers[0].trim()
                  let row = r + 1
                  for (let a = 0; a < allSurveyQuestions.length; a++) {
                     //LogThis(log, `processing question a=${a}`, L0)

                     let surveyQuestion = allSurveyQuestions[a]
                     LogVarsFilter(
                        log,
                        `processing question ${a}`,
                        a,
                        305,
                        L3,
                        'surveyQuestion=',
                        surveyQuestion,
                     )
                     let superSurveyQuestionCol =
                        surveyQuestion.superSurveyCol - 1
                     //transform the question answer value into the weighted answer for that Survey.
                     let weightedResponse = null
                     let response = null
                     let isWeighted = null

                     if (
                        surveyQuestion.weights &&
                        (Object.keys(surveyQuestion.weights).length > 0 ||
                           surveyQuestion.weigths.length > 0)
                     ) {
                        let answerA = answers[superSurveyQuestionCol]
                           .toString()
                           .trim()
                           .replace(/'\n'/g, '')
                        switch (surveyQuestion.weightType) {
                           case WEIGHTED_PAIRS:
                              weightedResponse = surveyQuestion.weights[answerA]
                              break
                           case WEIGHTED_CRITERIA:
                              try {
                                 weightedResponse = applyStringCriteriaToValue(
                                    surveyQuestion.weights,
                                    answerA,
                                 )
                              } catch (error) {
                                 LogThis(log, `error: ${error.message}`, L0)
                              }
                        }
                        LogThis(
                           log,
                           `question weights=${JSON.stringify(
                              surveyQuestion.weights,
                           )}`,
                           L3,
                        )
                        LogThis(
                           log,
                           `BEFORE col=${superSurveyQuestionCol}; fieldName=${surveyQuestion.fieldName}; isWeighted=${isWeighted}; answerA=${answerA}; weightedResponse=${weightedResponse}`,
                           L3,
                        )
                        if (weightedResponse === undefined) {
                           weightedResponse = answerA
                           isWeighted = false
                        } else {
                           isWeighted = true
                        }
                        response = answerA
                        answers[superSurveyQuestionCol] = weightedResponse
                        LogThis(
                           log,
                           `AFTER col=${superSurveyQuestionCol}; fieldName=${surveyQuestion.fieldName}; isWeighted=${isWeighted}; answerA=${answerA}; weightedResponse=${weightedResponse}`,
                           L3,
                        )
                     } else {
                        //CASE NO_WEIGHTED
                        let answerA = answers[superSurveyQuestionCol]
                        response = answerA
                        weightedResponse = answerA
                        isWeighted = false
                        LogThis(
                           log,
                           `no weighted: superSurveyQuestionCol=${superSurveyQuestionCol}; answer=${weightedResponse}`,
                           L3,
                        )
                     }

                     surveyResponses.push({
                        questionId: surveyQuestion._id,
                        respondentId: respondentId,
                        row: row,
                        col: a + 1,
                        response: response,
                        responseReal: answersReal[superSurveyQuestionCol],
                        weightedResponse: weightedResponse,
                        isWeighted: isWeighted,
                     })

                     if (isWeighted) {
                        LogThis(
                           log,
                           `Adding csv weighted answer: weightedResponse=${weightedResponse}`,
                           L3,
                        )
                        weightedResponse = weightedResponse ?? ''
                        //csv = csv + weightedResponse.toString() + ",";
                     } //else {
                     //     csv = csv + response.toString() + ",";
                     //   }
                  }

                  LogThis(
                     log,
                     `surveyResponses=${JSON.stringify(
                        surveyResponses,
                        null,
                        2,
                     )}`,
                     L3,
                  )

                  LogThis(
                     log,
                     `allCalculatedFields=${JSON.stringify(
                        allCalculatedFields,
                        null,
                        1,
                     )}`,
                     L3,
                  )
                  for (let a = 0; a < allCalculatedFields.length; a++) {
                     LogThis(
                        log,
                        `row=${row}; allCalculatedFields[a]._id=${allCalculatedFields[a].fieldName}`,
                        L3,
                     )
                     let allCalculatedField = allCalculatedFields[a]
                     let value = null
                     if (
                        allCalculatedField.calculationType ===
                        CAL_CRITERIA_ON_OTHER_FIELD
                     ) {
                        let criteria = allCalculatedField.criteria
                        LogThis(
                           log,
                           `Criteria in Question: criteria=${JSON.stringify(
                              criteria,
                              null,
                              2,
                           )}`,
                           L3,
                        )
                        let fieldNameValue = allCalculatedFields.find(
                           calField => {
                              LogThis(
                                 log,
                                 `calField=${JSON.stringify(
                                    calField,
                                    null,
                                    2,
                                 )}`,
                                 L3,
                              )
                              return (
                                 calField.fieldName ==
                                 criteria.fieldNameValue[0]
                              )
                           },
                        )
                        LogThis(
                           log,
                           `fieldNameValue1=${JSON.stringify(
                              fieldNameValue,
                              null,
                              2,
                           )}`,
                           L3,
                        )
                        let position = fieldNameValue.position
                        let calValue = calculatedValues.find(
                           value => value.col == position && value.row == row,
                        )
                        LogThis(
                           log,
                           `About to get into case > calValue=${JSON.stringify(
                              calValue,
                              null,
                              2,
                           )}; criteria.operator=${JSON.stringify(
                              criteria.operator,
                              null,
                              2,
                           )}`,
                           L3,
                        )
                        switch (criteria.operator) {
                           case '>':
                              LogThis(
                                 log,
                                 `Inside case: calValue.value=${calValue.value};criteria.value=${criteria.value};criteria.resultIfTrue=${criteria.resultIfTrue}`,
                                 L3,
                              )
                              if (calValue.value > criteria.value) {
                                 value = criteria.resultIfTrue
                                 LogThis(
                                    log,
                                    `Creteria is true: value=${value}`,
                                    L3,
                                 )
                              } else {
                                 value = criteria.resultIfFalse
                                 LogThis(
                                    log,
                                    `Creteria is false: value=${value}`,
                                    L3,
                                 )
                              }
                              break
                           default:
                              value = null
                              LogThis(
                                 log,
                                 `Case entered default: value${value}`,
                                 L3,
                              )
                        }
                     } else if (
                        allCalculatedField.calculationType === CAL_SUM_THE_GROUP
                     ) {
                        let groups = allCalculatedField.group
                        groups.map(group => {
                           let newVal = parseInt(answers[group])

                           if (
                              typeof newVal != 'number' ||
                              newVal == null ||
                              isNaN(newVal)
                           ) {
                              newVal = 0
                           }
                           value = value + newVal
                        })
                     } else if (
                        allCalculatedField.calculationType ===
                        CAL_CONCAT_GROUP_BASED_ON_CRITERIA
                     ) {
                        let groups = allCalculatedField.group
                        value = ''
                        for (let i = 0; i < groups.length; i++) {
                           let group = groups[i]
                           if (
                              applyStringCriteriaToValue(
                                 allCalculatedField.criteria,
                                 parseInt(answers[group]),
                              ) == 1
                           ) {
                              LogThis(
                                 log,
                                 `groups=${groups}; group=${group}; calField=${allCalculatedField.fieldName};`,
                                 L3,
                              )
                              let questionSelected = allSurveyQuestions.find(
                                 q => q.superSurveyCol == group + 1,
                              )
                              LogThis(
                                 log,
                                 `groups=${groups}; group=${
                                    group + 1
                                 }; calField=${
                                    allCalculatedField.fieldName
                                 }; questionSelected.questionShort=${questionSelected.question.replace(
                                    /,/g,
                                    ';',
                                 )}`,
                                 L3,
                              )

                              value =
                                 value +
                                 questionSelected.question.replace(/,/g, ' ') +
                                 '; '
                           }
                        }
                     } else {
                        LogThis(
                           log,
                           `Invalid calculated field calculation type = ${
                              allCalculatedField.calculationType
                           } ${JSON.stringify(allCalculatedField)}`,
                           L3,
                        )

                        throw new Error(
                           `Invalid calculated field calculation type = ${JSON.stringify(
                              allCalculatedField,
                           )}`,
                        )
                     }
                     LogThis(
                        log,
                        `Pushing value: calculatedFieldId=${
                           allCalculatedFields[a]._id
                        }; row=${row};col=${a + 1}; value=${value};`,
                        L3,
                     )

                     calculatedValues.push({
                        calculatedFieldId: allCalculatedFields[a]._id,
                        respondentId: respondentId,
                        row: row,
                        col: a + 1,
                        value: value,
                     })
                     //csv = csv + value.toString() + ",";
                  }
                  //csv = csv.slice(0, -1);
                  //csv = csv + "\n";
               }
               LogThis(
                  log,
                  `calculatedValues=${JSON.stringify(
                     calculatedValues,
                     null,
                     2,
                  )}`,
                  L3,
               )
               //get outputLayout from response

               const outputLayout = surveyConfigs.outputLayout

               LogThis(
                  log,
                  `outputLayouts=${JSON.stringify(outputLayout, null, 2)}`,
                  L3,
               )

               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: { message: "Generando el archivo CSV.", row: 0 },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));

               //let csvLayout = ''
               // let layout = null
               // for (let o = 0; o < outputLayout.length - 1; o++) {
               //    layout = outputLayout[o]
               //    csvLayout =
               //       csvLayout + layout.description.replace(/,/g, ';') + ','
               // }
               // LogThis(log, `outputLayout data csvLayout=${csvLayout}`, L3)

               // layout = outputLayout[outputLayout.length - 1]
               // csvLayout =
               //    csvLayout + layout.description.replace(/,/g, ';') + '\n'

               // for (let o = 0; o < outputLayout.length - 1; o++) {
               //    layout = outputLayout[o]
               //    csvLayout =
               //       csvLayout +
               //       layout.shortDescription.replace(/,/g, ';') +
               //       ','
               // }
               // layout = outputLayout[outputLayout.length - 1]
               //csvLayout =
               //  csvLayout + layout.shortDescription.replace(/,/g, ';') + '\n'

               const cols = []
               LogThis(log, `Mapping columns to Layout`, L3)

               for (let o = 0; o < outputLayout.length; o++) {
                  layout = outputLayout[o]
                  LogThis(
                     log,
                     `layout.fieldId=${layout.fieldId}; layout.isCalculated=${layout.isCalculated}`,
                     L3,
                  )
                  if (layout.isCalculated) {
                     LogThis(
                        log,
                        `layout.isCalculated=${layout.isCalculated}`,
                        L3,
                     )
                     cols.push(
                        calculatedValues
                           .filter(
                              val => val.calculatedFieldId == layout.fieldId,
                           )
                           .sort((a, b) => a.row - b.row),
                     )
                  } else {
                     let responses = surveyResponses.filter(
                        val => val.questionId == layout.fieldId,
                     )
                     //LogThis(log, `responsesFound = ${JSON.stringify(responses)}`);
                     responses = responses.sort((a, b) => a.row - b.row)
                     //LogThis(log, `responsesSorted = ${JSON.stringify(responses)}`);
                     cols.push(responses)
                  }
               }
               LogThis(
                  log,
                  `cols=${JSON.stringify(
                     cols,
                     null,
                     2,
                  )}; outputLayout=${JSON.stringify(outputLayout, null, 2)}`,
                  L3,
               )

               let value = null
               LogThis(
                  log,
                  `cols Length=${cols.length}; rows length=${cols[0].length}; outputLayout Length=${outputLayout.length}`,
                  L3,
               )
               console.log(`Getting values for the columns in the layout`)

               let row = []
               let outputValues = []
               for (let r = 0; r < cols[0].length; r++) {
                  // if (r % 10 === 0) {
                  //   dispatch({
                  //     type: SURVEY_PROCESS_ANSWERS_STATUS,
                  //     payload: {
                  //       message: "Agregando encuesta al archivo CSV, número:",
                  //       row: r + 1,
                  //     },
                  //   });
                  //   await new Promise((resolve) => setTimeout(resolve, 1));
                  // }

                  for (let c = 0; c < cols.length - 1; c++) {
                     layout = outputLayout[c]

                     // LogThis(
                     //    log,
                     //    `Processing Col=${c}; row=${r}`,
                     //    DEBUG_SECTION,
                     // )

                     value = cols[c][r]
                     LogThis(
                        log,
                        `value cycle=${JSON.stringify(value, null, 2)}`,
                        L3,
                     )
                     if (layout.outputAsReal) {
                        value = value.responseReal
                     } else {
                        if ('isWeighted' in value) {
                           if (value.isWeighted) {
                              value = value.weightedResponse
                           } else {
                              value = value.response
                           }
                        } else {
                           value = value.value
                        }
                     }

                     if (value == null || value == undefined) {
                        value = ''
                     }
                     LogThis(log, `value=${value}`, L3)
                     //csvLayout = csvLayout + value + ','
                     row.push(value)
                  }
                  LogThis(
                     log,
                     `Processing Last Col=${outputLayout.length - 1}; row=${r}`,
                     L3,
                  )
                  value = cols[outputLayout.length - 1][r]

                  if (layout.outputAsReal) {
                     value = value.responseReal
                  } else {
                     if ('isWeighted' in value) {
                        if (value.isWeighted) {
                           value = value.weightedResponse
                        } else {
                           value = value.response
                        }
                     } else {
                        value = value.value
                     }
                  }

                  if (value == null || value == undefined) {
                     value = ''
                  }
                  LogThis(log, `value=${value}`, L3)
                  //csvLayout = csvLayout + value + '\n'
                  row.push(value)

                  outputValues.push([...row])
                  LogThis(
                     log,
                     `Building outputValues: row=${JSON.stringify(
                        row,
                     )}; outputValues=${JSON.stringify(outputValues)}`,
                     L3,
                  )
                  row.length = 0
               }
               LogThis(log, `Output layout is ready`, L3)

               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: { message: "Archivo CSV generado.", row: 0 },
               //  });

               //  await new Promise((resolve) => setTimeout(resolve, 1));
               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: {
               //      message: "Guardando encuestas y respuestas en la base de datos",
               //      row: 0,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));
               //console.log(`CATCH PRE`);
               const columnsNames = []
               outputLayout.forEach(column => {
                  columnsNames.push(column.fieldName)
               })

               const outputData = {
                  columnsNames: columnsNames,
                  outputValues: null,
               }

               //if (csvLayout && csvLayout.length > 0) {
               if (outputValues && outputValues.length > 0) {
                  //console.log(`CATCH IN OUTPUT`);

                  // dispatch({
                  //   type: SURVEY_PROCESS_ANSWERS_STATUS,
                  //   payload: {
                  //     message: "Enviando respuestas a la base de datos en partes.",
                  //     row: 0,
                  //   },
                  // });
                  // await new Promise((resolve) => setTimeout(resolve, 1));
                  LogThis(log, `status sent`, L3)

                  LogThis(log, `after promise`, L3)
                  let row = 0
                  let r = 0
                  const outputValuesSlice = []
                  const sliceSize =
                     process.env.KUARSIS_DB_SURVEY_ANSWERS_BATCH_SIZE

                  // if (updateType == "all") {
                  //   LogThis(log, `About to call axios.delete for /outputs`, L3);

                  //   await axios.delete(
                  //     BACKEND_ENDPOINT + `/surveys/${surveySuperiorId}/outputs`,
                  //     config
                  //   );
                  //   LogThis(log, `After calling axios.delete for /outputs`, L3);
                  // }

                  for (
                     let slice = 1;
                     slice <= Math.ceil(outputValues.length / sliceSize);
                     slice++
                  ) {
                     LogThis(log, `CATCH ERROR 2`, L3)
                     for (
                        r = row;
                        r < row + sliceSize && r < outputValues.length;
                        r++
                     ) {
                        outputValuesSlice.push([...outputValues[r]])
                        LogThis(
                           log,
                           `Pushing row to slice ${slice} row ${r}; outputValues=${JSON.stringify(
                              outputValues[r],
                           )}; outputValuesSlice=${JSON.stringify(
                              outputValuesSlice,
                           )}`,
                           L3,
                        )
                     }
                     LogThis(log, `CATCH ERROR 3`, L3)
                     //outputData.outputValues = outputValuesSlice;
                     row = r
                     LogThis(
                        log,
                        `current slice ${slice} outputValuesSlice=${JSON.stringify(
                           outputValuesSlice,
                        )}`,
                        L3,
                     )

                     //   dispatch({
                     //     type: SURVEY_PROCESS_ANSWERS_STATUS,
                     //     payload: {
                     //       message: `Enviando parte ${slice} encuesta número ${
                     //         r - sliceSize
                     //       } a la ${r}`,
                     //       row: r,
                     //     },
                     //   });
                     //   await new Promise((resolve) => setTimeout(resolve, 1));
                     //LogThis(log, `about to call axios send output data`, L3);
                     // LogThis(
                     //    log,
                     //    `about to call post axios for /outputs with: config=${JSON.stringify(
                     //       config,
                     //    )}; slice=${slice}`,
                     //    L3,
                     // )

                     //   await axios.post(
                     //     BACKEND_ENDPOINT + `/surveys/${surveySuperiorId}/outputs`,
                     //     outputData,
                     //     config
                     //   );
                     await surveySaveOutputHelper(
                        surveySuperiorId,
                        columnsNames,
                        outputValuesSlice,
                        true,
                     )
                     newResponseFound.process_status =
                        SURVEY_PROCESS_STATUS.PROCESSED
                     newResponseFound.save()
                     LogThis(
                        log,
                        `AFTER call surveySaveOutputHelper get /outputs slice=${slice}`,
                        L3,
                     )
                     outputValuesSlice.length = 0
                  }

                  //const csvLayout = "Hola Mundo";
                  // dispatch({
                  //   type: SURVEY_PROCESS_ANSWERS_SUCCESS,
                  //   payload: {
                  //     csvLayout: csvLayout,
                  //     surveySuccessMessage: `Procesamiento finalizado. Encuestas nuevas procesadas: ${outputValues.length}`,
                  //   },
                  // });
                  // await new Promise((resolve) => setTimeout(resolve, 1));
                  // dispatch({
                  //   type: SURVEY_PROCESS_ANSWERS_STATUS,
                  //   payload: {
                  //     message: `Procesamiento de encuestas terminado, encuentre archivo CSV in el folder de downloads`,
                  //     row: r,
                  //     //row: 0,
                  //   },
                  // });
                  // await new Promise((resolve) => setTimeout(resolve, 1000));
               } else {
                  throw Error('No CSV data generated.')
               }
            } else {
               LogThis(log, `answersRows files does not contains new data`, L3)
               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_STATUS,
               //    payload: {
               //      message: `Los archivos no contienen respuestas nuevas, el sistema ya está al corriente.`,
               //      row: 0,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));
               //const csvLayout = "Hola Mundo";
               LogThis(
                  log,
                  `answersRows files does not contains new data Dispatched SUCCESS`,
                  L3,
               )
               //  dispatch({
               //    type: SURVEY_PROCESS_ANSWERS_SUCCESS,
               //    payload: {
               //      csvLayout: "",
               //      surveySuccessMessage: `Procesamiento finalizado. Encuestas nuevas procesadas: 0`,
               //    },
               //  });
               //  await new Promise((resolve) => setTimeout(resolve, 1));
            }
         } else {
            throw Error('Survey response files were not provided as expected.')
         }
      } catch (error) {
         // dispatch({
         //   type: SURVEY_PROCESS_ANSWERS_FAIL,
         //   payload:
         //     error.response && error.response.data.message
         //       ? error.response.data.message
         //       : error.message,
         // });
         LogThis(
            log,
            `error while updating responses: error=${error.message}`,
            L0,
         )
         throw error
      }
      // newResponseFound.process_status = SURVEY_PROCESS_STATUS.PROCESSED
      // newResponseFound.save()
      //throw new Error(`testing error`)
      // END OF PROCESSING THE SURVEY MONKEY ANSWERS INCLUDING CALCULATED FIELDS
      return {
         //csvLayout: csvLayout,
         rowValue: rowValue,
         rowReal: rowReal,
         rowScore: rowScore,
         monkeyConfigs: monkeyConfigs,
         monkeyResponses: monkeyResponses,
      }
   } catch (error) {
      // //res.status(404).json({ message: 'Error monkeyUpdateResponses2' })
      // for (let i = 0; i < newRespondents.length; i++) {
      //    respondent = newRespondents[i]
      //    respondent.process_status = RESPONSE_PROCESSING_COMPLETE_FAILED
      //    await response.save()
      // }
      newResponseFound.process_status = SURVEY_PROCESS_STATUS.FAILED
      newResponseFound.save()
      throw new Error(
         `Error monkeyUpdateResponses2Helper error=${error.message}`,
      )
   }
}

const monkeyUpdateResponses2 = asyncHandler(async (req, res) => {
   try {
      const surveyShortName = req.params.id
      const returnValue = await monkeyUpdateResponses2Helper(surveyShortName)

      res.header('Content-Type', 'application/json; charset=utf-8')
      res.status(200).json({
         csvLayout: returnValue.csvLayout,
         rowValue: returnValue.rowValue,
         rowReal: returnValue.rowReal,
         rowScore: returnValue.rowScore,
         monkeyConfigs: returnValue.monkeyConfigs,
         monkeyResponses: returnValue.monkeyResponses,
      })
   } catch (error) {
      res.status(404).json({ message: 'Error monkeyUpdateResponses2' })
      throw error
   }
})

const getReportRDLC = asyncHandler(async (req, res) => {
   try {
      const surveyShortName = req.params.id
      // const returnValue = await monkeyUpdateResponses2Helper(surveyShortName)

      res.header('Content-Type', 'application/json; charset=utf-8')
      res.status(200).json({
         csvLayout: returnValue.csvLayout,
         rowValue: returnValue.rowValue,
         rowReal: returnValue.rowReal,
         rowScore: returnValue.rowScore,
         monkeyConfigs: returnValue.monkeyConfigs,
         monkeyResponses: returnValue.monkeyResponses,
      })
   } catch (error) {
      res.status(404).json({ message: 'Error monkeyUpdateResponses2' })
      throw error
   }
})

module.exports = {
   superSurveyUploadAnswers,
   createSuperSurvey,
   superSurveyTests,
   getSuperSurveyConfigs,
   superSurveyGetList,
   superSurveySaveOutput,
   superSurveyDeleteOutputValues,
   superSurveyGetOutputValues,
   superSurveyGetRespondentIds,
   updateMonkeyConfigs,
   superSurveyCreateConfigIntegratedWithMonkey,
   testMonkey,
   monkeyWebhookCreatedEvent,
   monkeyWebhookCompletedEventTalentos2020,
   monkeyWebhookCompletedEventTalentosRedesign2020,
   bulkMonkeyWebhookCompletedEventTalentosRedesign2020,
   //monkeyUpdateResponses,
   monkeyUpdateResponses2,
   getReportRDLC,
}
