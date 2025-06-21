/** @format */

let express = require('express')
const multer = require('multer')

// Configure multer for handling file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const { LogThis, LoggerSettings, L0 } = require('../utils/Logger.js')

const router = express.Router()
let {
   superSurveyUploadAnswers,
   createSuperSurvey,
   //superSurveyTests,
   getSuperSurveyConfigs,
   superSurveyGetList,
   superSurveySaveOutput,
   superSurveyDeleteOutputValues,
   superSurveyGetOutputValues,
   superSurveyGetRespondentIds,
   // superSurveyUpdateOutput,
   updateMonkeyConfigs,
   superSurveyCreateConfigIntegratedWithMonkey,
   testMonkey,
   monkeyWebhookCreatedEvent,
   // monkeyWebhookCompletedEventTalentos2020,
   monkeyWebhookCompletedEventTalentosRedesign2020,
   bulkMonkeyWebhookCompletedEventTalentosRedesign2020,
   //monkeyUpdateResponses,
   monkeyUpdateResponses2,
   getReportRDLC,
} = require('../controllers/surveyController.js')
let {
   protect,
   admin,
   protectMonkeyWebhook,
   hasAccess,
} = require('../middleware/authMiddleware.js')
//const { LoggerSettings } = require("../utils/Logger.js");

router.route('/:id/configs').get(protect, admin, getSuperSurveyConfigs)

//router.route("/:id/outputs").get(protect, admin, superSurveyGetOutputValues);
router
   .route('/:id/outputs')
   .post(protect, admin, superSurveySaveOutput)
   .delete(protect, admin, superSurveyDeleteOutputValues)
   .get(protect, hasAccess, superSurveyGetOutputValues)

router
   .route('/:id/respondentidsinfo')
   .get(protect, admin, superSurveyGetRespondentIds)

router
   .route('/:id')
   .put(
      protect,
      admin,
      upload.fields([{ name: 'fileNumeric' }, { name: 'fileReal' }]),
      superSurveyUploadAnswers,
   )

router.route('/:id/surveymonkey').post(protect, admin, updateMonkeyConfigs)

router
   .route('/:id/integratemonkey')
   .post(protect, admin, superSurveyCreateConfigIntegratedWithMonkey)

router.route('/surveymonkey/test').get(protect, admin, testMonkey)
//report
router.route('/reportrdlc').get(getReportRDLC)

router
   .route('/surveymonkey/webhookcreatedevent')
   .head((req, res) => {
      // Respond to HEAD requests with appropriate headers
      const log = LoggerSettings('surveyRoutes.js', 'webhookcreatedevent')
      LogThis(log, `req.header=${JSON.stringify(req.headers)}`, L0)
      res.status(200).end()
   })
   .post(monkeyWebhookCreatedEvent)

router
   .route('/surveymonkey/webhookcompletedeventTalentos2020')
   .head((req, res) => {
      // Respond to HEAD requests with appropriate headers
      const log = LoggerSettings('surveyRoutes.js', 'webhookcompletedevent')
      LogThis(log, `req.header=${JSON.stringify(req.headers)}`, L0)
      res.status(200).end()
   })
   .post(protectMonkeyWebhook, monkeyWebhookCompletedEventTalentosRedesign2020)
//superSurveyCreateConfigIntegratedWithMonkey

router
   .route('/surveymonkey/webhookcompletedeventTalentosRedesign2020')
   .head((req, res) => {
      // Respond to HEAD requests with appropriate headers
      const log = LoggerSettings('surveyRoutes.js', 'webhookcompletedevent')
      LogThis(log, `req.header=${JSON.stringify(req.headers)}`, L0)
      res.status(200).end()
   })
   .post(protectMonkeyWebhook, monkeyWebhookCompletedEventTalentosRedesign2020)

router
   .route('/surveymonkey/bulkwebhookcompletedeventTalentosRedesign2020')
   .post(protect, admin, bulkMonkeyWebhookCompletedEventTalentosRedesign2020)

router.route('/surveymonkey/refresh')

router.route('/surveymonkey/updateresponses/:id').put(monkeyUpdateResponses2)

router
   .route('/')
   .get(protect, hasAccess, superSurveyGetList)
   .post(protect, admin, createSuperSurvey)

module.exports = router
