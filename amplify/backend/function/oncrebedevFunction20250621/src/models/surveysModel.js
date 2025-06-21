/**
 * @prettier
 */

let mongoose = require('mongoose')
const { LogThis, LoggerSettings, j, L3 } = require('../utils/Logger')
const sourceFile = 'surveysModel'
const surveyQuestionModel = mongoose.Schema(
   {
      surveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'Survey',
      },
      position: { type: Number, required: true },
      fieldName: { type: String, required: true, unique: true },
      //subScale was added and it will hold the subScale group for calculatedFields group sums or actions. All questions belonging to the same subscale, will have the same subScale value, which will be then referenced in the calculatedFields group property as a single subscale, or multiple subscales part of the same group.
      subScale: { type: String, required: true },
      question: { type: String, required: true },
      questionShort: { type: String, required: true },
      weightType: { type: String, required: true },
      weights: { type: mongoose.Schema.Types.Mixed },
      monkeyInfo: {
         position: { type: Number, required: true },
         subPosition: { type: Number, required: true },
         answerType: { type: String, required: true },
         otherInfo: { type: mongoose.Schema.Types.Mixed, required: false },
      },

      //surveyCol changed name to position.
      //surveyCol: { type: Number, required: true },

      //superSurveyCol was removed because questions no longer directly pertain to superSurveys, only pertain to surveys.
      //superSurveyCol: { type: Number, required: true },

      // //monkeyId, monkeyPoisition, monkeyFamily, monkeySubType and monkeyAnswers will be moved inside monkeyInfo and also planning to remove the survey word from monkey and will leave it as monkey only to make it shorter, and also to encapsulate all monkey information on the same property.

      // monkeyId: { type: String, required: false, default: '' },
      // monkeyPosition: {
      //    type: mongoose.Schema.Types.Mixed,
      //    required: false,
      // },

      // //The below commented fields will be part of monkeyInfo
      // monkeyFamily: { type: String, required: false, default: '' },
      // monkeySubType: { type: String, required: false, default: '' },
      // monkeyAnswers: {
      //    type: mongoose.Schema.Types.Mixed,
      //    required: false,
      //    default: null,
      // },
   },
   {
      timestamps: true,
   },
)

const SurveyQuestion = mongoose.model('SurveyQuestion', surveyQuestionModel)

const surveyMultiModel = mongoose.Schema(
   {
      //The template
      superSurveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'SuperSurvey',
      },
      //The template has the shortSurveyName value which the code will use to match with the survey and get its surveyId which will store in this field.
      superSurveyShortName: { type: String, required: true },
      surveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'Survey',
      },
      surveyShortName: { type: String, required: true },
      //This is the position of the survey within the superSurvey in KSS.
      position: { type: Number, required: true },
      //This is the corresponding position in Survey Monkey for this survey within the Overall Survey. This is the Pages.Page.position field in Survey Monkey.
      monkeyPosition: { type: Number, required: true },
      // //surveyId was moved to the surveys array which will list all surveys for the super survey.
      // surveyId: {
      //    type: mongoose.Schema.Types.ObjectId,
      //    required: true,
      //    ref: 'Survey',
      // },
      // //position name changed to position and moved into the surveys array.
      // position: { type: Number, required: true },
      // monkeyInfo: {
      //    type: mongoose.Schema.Types.Mixed,
      //    required: false,
      // },
   },
   {
      timestamps: true,
   },
)

const SurveyMulti = mongoose.model('SurveyMulti', surveyMultiModel)

const surveySuperiorOutputLayoutModel = mongoose.Schema(
   {
      surveySuperiorId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'SurveySuperior',
      },
      surveyShortName: { type: String, required: true },
      fieldName: { type: String, required: true },
      dataType: { type: String, required: true, default: 'String' },
      displayType: {
         type: mongoose.Schema.Types.Mixed,
         required: true,
         default: { type: 'asIs' },
      },
      outputAsReal: { type: Boolean, required: true },
      showInSurveyOutputScreen: { type: Boolean, require: true },
      position: { type: Number, required: true },
   },
   {
      timestamps: true,
   },
)
const SurveySuperiorOutputLayout = mongoose.model(
   'SurveySuperiorOutputLayout',
   surveySuperiorOutputLayoutModel,
)

const surveyCalculatedFieldModel = mongoose.Schema(
   {
      surveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'Survey',
      },
      description: { type: String, required: true },
      shortDescription: { type: String, required: true },
      fieldName: { type: String, required: true, unique: true },
      calculationType: { type: String, required: true },
      criteria: { type: mongoose.Schema.Types.Mixed, required: false },
      ////changed group name by subScale
      //group: { type: mongoose.Schema.Types.Mixed, required: false },
      subScales: { type: mongoose.Schema.Types.Mixed, required: false },
      // //changed position name by position
      // position: { type: Number, required: true },
      position: { type: Number, required: true },
   },
   {
      timestamps: true,
   },
)

const SurveyCalculatedField = mongoose.model(
   'SurveyCalculatedField',
   surveyCalculatedFieldModel,
)

const surveyModel = mongoose.Schema(
   {
      owner: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'User',
      },

      surveyName: { type: String, required: true },
      surveyShortName: { type: String, required: true, unique: true },
      description: { type: String, required: false },
      instructions: { type: String, required: false },
      //monkeyId and monkeyPosition names changed to monkeyId and monkeyPosition and moved inside the monkeyInfo
      // monkeyId: { type: String, required: false, default: '' },
      // monkeyPosition: { type: Number, required: false, default: 0 },
      monkeyInfo: {
         monkeyId: { type: String, required: false, default: '' },
         monkeyPosition: { type: Number, required: false, default: 0 },
         additionalInfo: { type: mongoose.Schema.Types.Mixed, required: false },
      },
   },
   {
      timestamps: true,
   },
)

surveyModel.pre('remove', async function (next) {
   try {
      LogThis(log, `SurveyQuestion deleting`, L3)
      await SurveyQuestion.deleteMany({ surveyId: this._id })
      LogThis(log, `SurveyQuestion deleting result=${j(result)}`, L3)
      LogThis(log, `SurveyQuestion deleting`, L3)
      await SurveyCalculatedField.deleteMany({ surveyId: this._id })
      LogThis(log, `SurveyQuestion deleting result=${j(result)}`, L3)
      next()
   } catch (error) {
      next(error)
   }
})

const Survey = mongoose.model('Survey', surveyModel)

const surveySuperiorModel = mongoose.Schema(
   {
      owner: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'User',
      },
      surveyName: { type: String, required: true },
      superSurveyShortName: { type: String, required: true, unique: true },
      description: { type: String, required: false },
      position: { type: Number, required: false, default: 0 },
      monkeyInfo: { monkeyId: { type: Number, required: false } },
   },
   {
      timestamps: true,
   },
)

surveySuperiorModel.pre('remove', async function (next) {
   const log = new LoggerSettings(sourceFile, 'surveySuperiorModel.pre')

   try {
      let result = null
      LogThis(log, `Survey deleting`, L3)
      result = await Survey.deleteMany({ superSurveyId: this._id })
      LogThis(log, `Survey deleting result=${j(result)}`, L3)
      LogThis(log, `SurveySuperiorOutputLayout deleting`, L3)
      result = await SurveySuperiorOutputLayout.deleteMany({
         superSurveyId: this._id,
      })
      LogThis(
         log,
         `SurveySuperiorOutputLayout deleting result=${j(result)}`,
         L3,
      )
      next()
   } catch (error) {
      next(error)
   }
})
const SurveySuperior = mongoose.model('SurveySuperior', surveySuperiorModel)

////changed name from monkeyConfigModel to monkeyConfigModel
//const monkeyConfigModel = mongoose.Schema(
const monkeyConfigModel = mongoose.Schema(
   {
      ////changed name from monkeyId to monkeyId
      //monkeyId: { type: String, required: true },
      monkeyId: { type: String, required: true, unique: true },
      survey: { type: mongoose.Schema.Types.Mixed, required: false },
   },
   {
      timestamps: true,
   },
)
const MonkeyConfig = mongoose.model('MonkeyConfig', monkeyConfigModel)

const surveyMonkeyIntegratedModel = mongoose.Schema(
   {
      ////changed name from monkeyId to monkeyId
      //monkeyId: { type: String, required: true },
      superSurveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'SurveySuperior',
      },
      monkeyId: { type: String, required: true, unique: true },
      superSurveyShortName: { type: String, required: true, unique: true },
      surveyConfigs: { type: mongoose.Schema.Types.Mixed, required: false },
   },
   {
      timestamps: true,
   },
)
const SurveyMonkeyIntegrated = mongoose.model(
   'SurveyMonkeyIntegrated',
   surveyMonkeyIntegratedModel,
)

const monkeyAnswerModel = mongoose.Schema(
   {
      ////changed name from monkeyId to monkeyId
      //monkeyId: { type: String, required: true },
      monkeyId: { type: String, required: true },
      respondentId: { type: String, required: true, unique: true },
      answers: { type: mongoose.Schema.Types.Mixed, required: true },
   },
   {
      timestamps: true,
   },
)
const MonkeyAnswer = mongoose.model('MonkeyAnswer', monkeyAnswerModel)

//changed  name from monkeyNewResponseModel to monkeyNewResponseModel
//const monkeyNewResponseModel = mongoose.Schema(
const monkeyNewResponseModel = mongoose.Schema(
   {
      monkeyId: { type: String, required: true },
      respondent_id: { type: String, required: true },
      event_type: { type: String, required: true },
      event_datetime: { type: Date, required: true },
      processed_date: { type: Date, required: false },
      process_status: { type: String, required: true },
   },
   {
      timestamps: true,
   },
)
const MonkeyNewResponse = mongoose.model(
   'MonkeyNewResponse',
   monkeyNewResponseModel,
)

const superSurveyMonkey = mongoose.Schema(
   {
      superSurveyId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'SurveySuperior',
      },
      superSurveyShortName: { type: String, required: true, unique: true },
      survey: { type: mongoose.Schema.Types.Mixed, required: true },
   },
   {
      timestamps: true,
   },
)
const SuperSurveyMonkey = mongoose.model('SuperSurveyMonkey', superSurveyMonkey)

module.exports = {
   SurveySuperior,
   Survey,
   SurveyMulti,
   SurveyQuestion,
   SurveyCalculatedField,
   SurveySuperiorOutputLayout,
   MonkeyConfig,
   MonkeyNewResponse,
   SuperSurveyMonkey,
   SurveyMonkeyIntegrated,
   MonkeyAnswer,
}
