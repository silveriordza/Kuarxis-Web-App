/**
 * @format
 * @prittier
 * */

const axios = require('axios')
let {
   LogThis,
   HasDataException,
   LoggerSettings,
   L0,
   L1,
   L2,
   L3,
   LogVars,
   LogThisFilter,
   LogVarsFilter,
   HasData,
   j,
} = require('../utils/Logger.js')
const { validateHasData } = require('./Functions.js')

const {
   applyStringCriteriaToValue,
   formatDate,
} = require('../utils/Functions.js')

const { MonkeyAnswer } = require('../models/surveysModel.js')

const WEIGHTED_PAIRS = 'WEIGHTED_PAIRS'
const WEIGHTED_CRITERIA = 'WEIGHTED_CRITERIA'

const srcFileName = 'monkeyAPI.js'

const getMonkeyResponses = async newResponses => {
   const log = new LoggerSettings(srcFileName, 'getMonkeyResponses')
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
   const monkeyResponses = []
   for (let r = 0; r < newResponses.length; r++) {
      let response = newResponses[r]

      let surveyResponse = null
      let monkeyAnswer = await MonkeyAnswer.findOne({
         monkeyId: response.monkeyId,
         respondentId: response.respondent_id,
      })

      if (monkeyAnswer) {
         surveyResponse = monkeyAnswer.answers
      } else {
         let surveyResponseResult = await axios.get(
            `https://api.surveymonkey.com/v3/surveys/${response.monkeyId}/responses/${response.respondent_id}/details`,
            configMonkey,
         )
         surveyResponse = surveyResponseResult?.data
         if (surveyResponse) {
            monkeyAnswer = new MonkeyAnswer()
            monkeyAnswer.respondentId = response.respondent_id
            monkeyAnswer.monkeyId = response.monkeyId
            monkeyAnswer.answers = surveyResponse
            await monkeyAnswer.save()
         }
      }

      let surveyPagesMap = null
      let questionAnswersMap = null
      surveyPagesMap = new Map()
      questionAnswersMap = new Map()
      let multipleChoiceMap = null

      questionAnswersMap.set('INFO_1', surveyResponse.id)
      questionAnswersMap.set('INFO_2', surveyResponse.collector_id)
      questionAnswersMap.set('INFO_3', new Date(surveyResponse.date_created))
      questionAnswersMap.set('INFO_4', surveyResponse.date_modified)
      questionAnswersMap.set('INFO_5', surveyResponse.ip_address)
      questionAnswersMap.set('INFO_6', surveyResponse.email_address)
      questionAnswersMap.set('INFO_7', surveyResponse.first_name)
      questionAnswersMap.set('INFO_8', surveyResponse.last_name)
      questionAnswersMap.set('INFO_9', surveyResponse.custom_value)
      surveyPagesMap.set('INFO', questionAnswersMap)

      for (const page of surveyResponse.pages) {
         questionAnswersMap = new Map()
         for (const question of page.questions) {
            for (const answer of question.answers) {
               if (answer.hasOwnProperty('row_id')) {
                  questionAnswersMap.set(answer.row_id, answer)
               } else if (
                  answer.hasOwnProperty('choice_id') ||
                  answer.hasOwnProperty('other_id') /*&&
                  question.answers.length > 1*/
               ) {
                  //questionAnswersMap.set(answer.choice_id, answer)
                  //} else */ else {
                  let choice_id = null
                  if (answer.hasOwnProperty('other_id')) {
                     choice_id = answer.other_id
                  } else {
                     choice_id = answer.choice_id
                  }

                  if (questionAnswersMap.has(question.id)) {
                     multipleChoiceMap = questionAnswersMap.get(question.id)
                     multipleChoiceMap.set(choice_id, answer)
                  } else {
                     multipleChoiceMap = new Map()
                     multipleChoiceMap.set(choice_id, answer)
                     questionAnswersMap.set(question.id, multipleChoiceMap)
                  }
               } else {
                  questionAnswersMap.set(question.id, answer)
               }
            }
         }
         surveyPagesMap.set(page.id, questionAnswersMap)
      }
      surveyResponse.surveyPagesMap = surveyPagesMap

      monkeyResponses.push(surveyResponse)
   }

   // for (let monkeyResponse in monkeyResponses){
   //    let surveyPagesMap = null
   //    surveyPagesMap = new Map()

   //    for (let page in monkeyResponse.pages){
   //       let questionAnswersMap = null
   //       questionAnswersMap = new Map()
   //       for(let question in page.questions){
   //          for (let answer in question.answers){
   //             if (answer.hasOwnProperty("row_id")){
   //                questionAnswersMap.set(answer.row_id, answer)
   //             }else{
   //                questionAnswersMap.set(question.id, answer)
   //             }
   //          }
   //       }
   //       surveyPagesMap.set(page.id, questionAnswersMap)
   //       monkeyResponse.surveyPagesMap = surveyPagesMap
   //    }
   //    //182423261
   // }

   return monkeyResponses
}

const ValidateMonkeyConfigs = (monkeyConfigs, log) => {
   HasDataException(monkeyConfigs, `Monkey configuration is null or empty`, log)
   HasDataException(
      monkeyConfigs.survey,
      `Monkey configuration does not have super survey`,
      log,
   )
   HasDataException(
      monkeyConfigs.survey.pages,
      `Monkey configuration super survey does not have any surveys or pages`,
      log,
   )
}

const PushBlankPage = (colsValue, colsReal, colsScore, monkeyPageConfig) => {
   const functionName = 'monkeyUpdateResponses'
   const log = new LoggerSettings(srcFileName, functionName)
   //LogThis(log, `Array filled with empties: ${Array(monkeyPageConfig.questions.length).fill("")}`, L0)

   colsValue = colsValue.concat(
      Array(monkeyPageConfig.questions.length).fill(''),
   )
   colsReal = colsReal.concat(Array(monkeyPageConfig.questions.length).fill(''))
   colsScore = colsScore.concat(
      Array(monkeyPageConfig.questions.length).fill(''),
   )

   LogThis(log, `colsValue page filled with empty: ${colsValue}`, L3)
   LogThis(log, `colsReal page filled with empty: ${colsReal}`, L3)
   LogThis(log, `colsScore page filled with empty: ${colsScore}`, L3)
   return {
      colsValue: colsValue,
      colsReal: colsReal,
      colsScore: colsScore,
   }
}

const AnalyzeQuestionResponse = (
   monkeyQuestionConf,
   monkeyResponseQuestion,
) => {
   const log = new LoggerSettings(srcFileName, 'AnalyzeQuestionResponse')
   let value = null
   let realValue = null
   let score = null
   const monkeyQuestionDetailsConf = monkeyQuestionConf.details
   const monkeyQuestionAnswersConf = monkeyQuestionDetailsConf.answers
   const monkeyResponseAnswers = monkeyResponseQuestion?.answers
   const colsValue = []
   const colsReal = []
   const colsScore = []
   const cols = {
      colsValue: colsValue,
      colsReal: colsReal,
      colsScore: colsScore,
   }

   const pushValueCol = (valueIn, realValueIn, scoreIn) => {
      colsValue.push(valueIn)
      colsReal.push(realValueIn.trim().replace(/\u00A0/g, ' '))
      colsScore.push(scoreIn)
   }
   const pushEmptyCol = () => {
      colsValue.push('')
      colsReal.push('')
      colsScore.push('')
   }

   /**
    *
    * @param {*} choice - This is the survey monkey confing choice that should have position text and score properties.
    * @param {*} outputScoreAsValue - Set this value as true to set the value as score for the rated subtypes
    */
   const pushChoiceCol = (choice, outputScoreAsValue = false) => {
      let value = choice.position
      let text = choice.text.trim()
      let score = null

      if (choice['quiz_options'] != undefined) {
         score = choice.quiz_options.score
      } else if (choice['weight'] != undefined) {
         score = choice.weight
      } else {
         throw new Error(
            `Score property not found in question for choice id: ${choice.id}`,
         )
      }

      if (outputScoreAsValue) {
         value = score
      }

      if (!text || text == '') {
         text = value.toString()
      }
      pushValueCol(value, text, score)
   }

   //Validate that the question config id matches with the response question id if not, abort

   // if (monkeyResponseQuestion == null || monkeyResponseQuestion == undefined) {
   //    pushEmptyCol()
   //    return cols
   // }

   // if (
   //    monkeyQuestionDetailsConf &&
   //    monkeyResponseQuestion &&
   //    monkeyQuestionDetailsConf.id != monkeyResponseQuestion.id
   // ) {
   //    throw new Error(
   //       `The response question id does not match question config id for question config id ${monkeyQuestionDetailsConf.id} response id ${monkeyResponseQuestion.id}`,
   //    )
   // }

   // let subtype = monkeyQuestionDetailsConf.subtype

   // if (subtype == 'vertical_three_col') {
   //    subtype = 'vertical'
   // }

   let questionType =
      monkeyQuestionDetailsConf.family + '_' + monkeyQuestionDetailsConf.subtype

   switch (questionType) {
      case 'open_ended_single':
         if (
            monkeyResponseQuestion &&
            monkeyResponseAnswers &&
            monkeyResponseAnswers.length > 0
         ) {
            value = monkeyResponseAnswers[0].text.trim()
            realValue = monkeyResponseAnswers[0].text.trim()
            score = ''
         } else {
            value = ''
            realValue = ''
            score = ''
         }
         pushValueCol(value, realValue, score)

         break

      case 'single_choice_menu':
         //throw new Error(`BREAKING EXECUTION`)
         //questionMonkeyPosition = questionItem.monkeyPosition;
         {
            const DEBUG_SECTION = 'DEBUG_SINGLE_MENU'
            //process.env.LOG_LEVEL = 'DEBUG_SINGLE_MENU'
            const msg = 'single_choice_menu'
            const monkeyResponseAnswer = monkeyResponseAnswers[0]
            if (monkeyResponseAnswer['choice_id']) {
               const monkeyAnswerChoiceConf =
                  monkeyQuestionAnswersConf.choices.find(
                     confChoice =>
                        confChoice.id == monkeyResponseAnswer.choice_id,
                  )
               HasDataException(
                  monkeyAnswerChoiceConf,
                  `Choice in monkey response not found in survey config ${monkeyResponseAnswer.choice_id}`,
                  log,
               )
               //when choice is selected, the value, real and score are in the selected choice found in survey config.

               pushChoiceCol(monkeyAnswerChoiceConf)

               //When choice is selected, other values are empty in the output file.
               if (
                  monkeyQuestionAnswersConf['other'] != undefined &&
                  monkeyResponseAnswer['other_id'] == undefined
               ) {
                  pushEmptyCol()
               }

               LogVars(
                  log,
                  msg,
                  L3,
                  'monkeyAnswerChoiceConf',
                  monkeyAnswerChoiceConf,
               )
            } else if (monkeyResponseAnswer['other_id'] != undefined) {
               const monkeyAnswerChoiceConf =
                  monkeyQuestionAnswersConf.other.find(
                     otherConf => otherConf.id == monkeyResponseAnswer.other_id,
                  )

               HasDataException(
                  monkeyAnswerChoiceConf,
                  `Other choice in monkey response not found in survey config ${monkeyResponseAnswer.other_id}`,
                  log,
               )

               pushChoiceCol(monkeyAnswerChoiceConf)
               pushValueCol(
                  monkeyResponseAnswer.text,
                  monkeyResponseAnswer.text,
                  '',
               )
            } else {
               throw Error(
                  `Invalid choice in survey monkey response for question details=${j(
                     monkeyQuestionDetailsConf,
                  )}`,
               )
            }
         }
         break
      case 'single_choice_vertical':
      case 'single_choice_vertical_three_col':
         {
            const monkeyResponseAnswer = monkeyResponseAnswers[0]
            if (monkeyResponseAnswer['choice_id']) {
               const monkeyAnswerChoiceConf =
                  monkeyQuestionAnswersConf.choices.find(
                     confChoice =>
                        confChoice.id == monkeyResponseAnswer.choice_id,
                  )
               HasDataException(
                  monkeyAnswerChoiceConf,
                  `Choice in monkey response not found in survey config ${monkeyResponseAnswer.choice_id}`,
                  log,
               )
               //when choice is selected, the value, real and score are in the selected choice found in survey config.
               pushChoiceCol(monkeyAnswerChoiceConf)
               //When choice is selected, other values are empty in the output file.

               if (
                  monkeyQuestionAnswersConf['other'] != undefined &&
                  monkeyResponseAnswer['other_id'] == undefined
               ) {
                  pushEmptyCol()
               }
            } else if (monkeyResponseAnswer['other_id'] != undefined) {
               const monkeyAnswerChoiceConf =
                  monkeyQuestionAnswersConf.other.find(
                     otherConf => otherConf.id == monkeyResponseAnswer.other_id,
                  )

               HasDataException(
                  monkeyAnswerChoiceConf,
                  `Other choice in monkey response not found in survey config ${monkeyResponseAnswer.other_id}`,
                  log,
               )

               pushChoiceCol(monkeyAnswerChoiceConf)
               pushValueCol(
                  monkeyResponseAnswer.text,
                  monkeyResponseAnswer.text,
                  '',
               )
            } else {
               throw Error(
                  `Invalid choice in survey monkey response for question details=${j(
                     monkeyQuestionDetailsConf,
                  )}`,
               )
            }
         }
         break
      case 'matrix_rating': //for updating responses from survey monkey
         {
            for (
               let rowIndex = 0;
               rowIndex < monkeyQuestionAnswersConf.rows.length;
               rowIndex++
            ) {
               let monkeyRowConf = monkeyQuestionAnswersConf.rows[rowIndex]
               LogThis(log, `monkeyRowConf = ${j(monkeyRowConf)}`)

               let monkeyResponseAnswer = monkeyResponseAnswers.find(
                  monkeyResponse => monkeyResponse.row_id == monkeyRowConf.id,
               )

               if (HasData(monkeyResponseAnswer)) {
                  if (monkeyResponseAnswer['choice_id']) {
                     const monkeyAnswerChoiceConf =
                        monkeyQuestionAnswersConf.choices.find(
                           confChoice =>
                              confChoice.id == monkeyResponseAnswer.choice_id,
                        )
                     HasDataException(
                        monkeyAnswerChoiceConf,
                        `Choice in monkey response not found in survey config ${j(
                           monkeyResponseAnswer.choice_id,
                        )}`,
                        log,
                     )
                     //when choice is selected, the value, real and score are in the selected choice found in survey config.
                     pushChoiceCol(monkeyAnswerChoiceConf, true)
                     //When choice is selected, other values are empty in the output file.
                  } else {
                     pushEmptyCol()
                  }
               } else {
                  pushEmptyCol()
               }
            }
         }
         break
      case 'matrix_single': //for updating responses from survey monkey
         {
            for (
               let rowIndex = 0;
               rowIndex < monkeyQuestionAnswersConf.rows.length;
               rowIndex++
            ) {
               let monkeyRowConf = monkeyQuestionAnswersConf.rows[rowIndex]
               LogThis(log, `monkeyRowConf = ${j(monkeyRowConf)}`)

               let monkeyResponseAnswer = monkeyResponseAnswers.find(
                  monkeyResponse => monkeyResponse.row_id == monkeyRowConf.id,
               )

               if (HasData(monkeyResponseAnswer)) {
                  if (monkeyResponseAnswer['choice_id']) {
                     const monkeyAnswerChoiceConf =
                        monkeyQuestionAnswersConf.choices.find(
                           confChoice =>
                              confChoice.id == monkeyResponseAnswer.choice_id,
                        )
                     HasDataException(
                        monkeyAnswerChoiceConf,
                        `Choice in monkey response not found in survey config ${j(
                           monkeyResponseAnswer.choice_id,
                        )}`,
                        log,
                     )
                     //when choice is selected, the value, real and score are in the selected choice found in survey config.
                     pushChoiceCol(monkeyAnswerChoiceConf, true)
                     //When choice is selected, other values are empty in the output file.
                  } else {
                     pushEmptyCol()
                  }
               } else {
                  pushEmptyCol()
               }
            }
         }
         break
      case 'open_ended_numerical': //for updating responses from survey monkey
         {
            for (
               let rowIndex = 0;
               rowIndex < monkeyQuestionAnswersConf.rows.length;
               rowIndex++
            ) {
               let monkeyRowConf = monkeyQuestionAnswersConf.rows[rowIndex]

               //for(let monkeyResponseIndex=0; monkeyResponseIndex<monkeyResponseAnswers.length ; monkeyResponseIndex++){
               let monkeyResponseAnswer = monkeyResponseAnswers.find(
                  monkeyResponse => monkeyResponse.row_id == monkeyRowConf.id,
               )

               // HasDataException(
               //    monkeyResponseAnswer,
               //    `The monkey answer row was not found in the answers responses for ${monkeyRowConf}`,
               //    log,
               // )
               if (HasData(monkeyResponseAnswer)) {
                  let text = monkeyResponseAnswer.text
                  let value = Number.parseInt(text)

                  //when choice is selected, the value, real and score are in the selected choice found in survey config.
                  pushValueCol(value, text, value)
               } else {
                  pushEmptyCol()
               }
            }
         }
         break
      case 'DATETIME_DATE_ONLY':
         {
            // for (
            //    let rowIndex = 0;
            //    rowIndex < monkeyQuestionAnswersConf.rows.length;
            //    rowIndex++
            // ) {
            let monkeyRowConf = monkeyQuestionAnswersConf.rows[0]

            let monkeyResponseAnswer = monkeyResponseAnswers.find(
               monkeyResponse => monkeyResponse.row_id == monkeyRowConf.id,
            )

            if (HasData(monkeyResponseAnswer)) {
               let text = monkeyResponseAnswer.text
               let value = monkeyResponseAnswer.position

               //when choice is selected, the value, real and score are in the selected choice found in survey config.
               pushValueCol(value, text, value)
            } else {
               pushEmptyCol()
            }
            //}
         }
         break
      case 'multiple_choice_vertical_three_col':
      case 'multiple_choice_vertical': //for updating responses from survey monkey
         {
            for (
               let choiceIndex = 0;
               choiceIndex < monkeyQuestionAnswersConf.choices.length;
               choiceIndex++
            ) {
               let monkeyChoiceConf =
                  monkeyQuestionAnswersConf.choices[choiceIndex]

               //for(let monkeyResponseIndex=0; monkeyResponseIndex<monkeyResponseAnswers.length ; monkeyResponseIndex++){
               let monkeyResponseAnswer = monkeyResponseAnswers?.find(
                  monkeyResponse =>
                     monkeyResponse.choice_id == monkeyChoiceConf.id,
               )

               // HasDataException(
               //    monkeyResponseAnswer,
               //    `The monkey answer row was not found in the answers responses for ${monkeyChoiceConf}`,
               //    log,
               // )
               if (HasData(monkeyResponseAnswer)) {
                  if (monkeyResponseAnswer['choice_id'] != undefined) {
                     //when choice is selected, the value, real and score are in the selected choice found in survey config.
                     pushChoiceCol(monkeyChoiceConf)
                  } else {
                     throw Error(
                        `The choice_id value was not found in the answer as expected: ${j(
                           monkeyResponseAnswer,
                        )}`,
                     )
                  }
               } else {
                  //For multiple choice vertical option, if the choice was not selected in the answers, then push en empty column.
                  pushEmptyCol()
               }
            }
         }
         break
      //   {
      //     if (surveyQuestion.fieldName == "ESTRES_4") {
      //       LogThis(
      //         log,
      //         `ESTRES_4 multiple choice value inputs=${j({
      //           surveyQuestion: surveyQuestion,
      //           monkeyAnswer: monkeyAnswer,
      //         })}; `,
      //         L0
      //       );
      //     }
      //     let surveyChoice =
      //       surveyQuestion.monkeyAnswers.answerChoices.find((choice) => {
      //         if (surveyQuestion.fieldName == "ESTRES_5") {
      //           LogThis(
      //             log,
      //             `finding choice values =${j({
      //               choice: choice,
      //               choiceId: choice.id.toString().trim(),
      //               monkeyAnswer: monkeyAnswer.toString().trim(),
      //               condition:
      //                 choice.id.toString().trim() ==
      //                 monkeyAnswer.toString().trim(),
      //             })}`,
      //             L0
      //           );
      //         }
      //         return (
      //           choice.id.toString().trim() == monkeyAnswer.toString().trim()
      //         );
      //       });
      //     if (surveyQuestion.fieldName == "ESTRES_5") {
      //       LogThis(
      //         log,
      //         `found surveyChoice = ${j({
      //           surveyChoice: surveyChoice,
      //           negatedSurveyChoice: !surveyChoice,
      //         })}`,
      //         L0
      //       );
      //     }
      //     if (!surveyChoice) {
      //       LogThis(
      //         log,
      //         `Log Choice not found for ${monkeyAnswer} surveyChoice=${j(
      //           surveyChoice
      //         )}; question field: ${surveyQuestion.fieldName}`,
      //         L0
      //       );
      //       throw new Error(`Error Choice not found for ${monkeyAnswer}`);
      //     }
      //     value = surveyChoice.value; //if file is downloaded from survey monkey it sets the value of as the score instead of the position of the choice for matrix rating type.
      //     realValue = surveyChoice.realValue.trim(); //Triming because Survey Monkey sometimes introduces a non-breaking space character that is an invisible character that looks like a space but is not really a space (ASCII code 32) but an NBSP (ASCII code 160), which causes problems when copying the data into an Excel spreadsheet or CSV files.
      //     score = surveyChoice.score;
      //     if (surveyQuestion.fieldName == "BECK_Nomesientoespecialme") {
      //       LogThis(
      //         log,
      //         ` BECK_Nomesientoespecialme multiple_choice_vertical: finalValues=${j(
      //           {
      //             monkeyAnswer: monkeyAnswer,
      //             value: value,
      //             realValue: realValue,
      //             score: score,
      //             surveyChoice: surveyChoice,
      //             surveyQuestion: surveyQuestion,
      //           }
      //         )}`,
      //         L3
      //       );
      //     }
      //   }
      //   break;
      default:
         throw new Error(
            `Family:${monkeyQuestionDetailsConf.family} and subType=${monkeyQuestionDetailsConf.subtype} combination is not valid.`,
         )
   }
   LogThis(log, `cols=${j(cols)}`, L3)
   return cols
   // } else {
   //   value = ""; //if file is downloaded from survey monkey it sets the value of as the score instead of the position of the choice for matrix rating type.
   //   realValue = "";
   //   score = "";
   //   if (surveyQuestion.fieldName == "BECK_Nomesientoespecialme") {
   //     LogThis(
   //       log,
   //       ` BECK_Nomesientoespecialme else happened: finalValues=${j({
   //         value: value,
   //         realValue: realValue,
   //         score: score,
   //       })}`,
   //       L3
   //     );
   //   }
   // }
}

const AnalyzeQuestionResponseRedesign = (surveyQuestion, monkeyAnswer) => {
   const log = new LoggerSettings(srcFileName, 'AnalyzeQuestionResponse')
   let value = null
   let realValue = null
   let score = null
   // const monkeyQuestionDetailsConf = surveyQuestion.details
   // const monkeyQuestionAnswersConf = monkeyQuestionDetailsConf.answers
   // const monkeyResponseAnswers = monkeyAnswer?.answers
   // const colsValue = []
   // const colsReal = []
   // const colsScore = []
   // const cols = {
   //    colsValue: colsValue,
   //    colsReal: colsReal,
   //    colsScore: colsScore,
   // }

   const pushValueCol = (valueIn, realValueIn, scoreIn) => {
      value = valueIn
      realValue = realValueIn.trim().replace(/\u00A0/g, ' ')
      score = scoreIn
      return {
         value: valueIn,
         realValue: realValueIn.trim().replace(/\u00A0/g, ' '),
         score: scoreIn,
      }
   }
   const pushEmptyCol = () => {
      return {
         value: null,
         realValue: '',
         score: null,
      }
   }

   /**
    *
    * @param {*} choice - This is the survey monkey confing choice that should have position text and score properties.
    * @param {*} outputScoreAsValue - Set this value as true to set the value as score for the rated subtypes
    */
   const pushChoiceCol = (choice, outputScoreAsValue = false) => {
      let value = choice.value
      let text = choice.realValue.trim()
      let score = choice.score

      // if (choice['quiz_options'] != undefined) {
      //    score = choice.quiz_options.score
      // } else if (choice['weight'] != undefined) {
      //    score = choice.weight
      // } else {
      //    throw new Error(
      //       `Score property not found in question for choice id: ${choice.id}`,
      //    )
      // }

      if (outputScoreAsValue) {
         value = score
      }

      if (!text || text == '') {
         text = value.toString()
      }
      return pushValueCol(value, text, score)
   }

   const ProcessSingleChoiceAnswer = (surveyQuestion, monkeyAnswer) => {
      let answerField = surveyQuestion.monkeyInfo.monkeyAnswers.answerField
      if (HasData(monkeyAnswer) && monkeyAnswer[answerField] != undefined) {
         const monkeyAnswerChoiceConf =
            surveyQuestion.monkeyInfo.monkeyAnswers.answerChoices.find(
               confChoice => confChoice.id == monkeyAnswer[answerField],
            )
         if (HasData(monkeyAnswerChoiceConf)) {
            if (answerField == 'other_id') {
               monkeyAnswerChoiceConf.realValue = monkeyAnswer.text
               monkeyAnswerChoiceConf.value = monkeyAnswer.text
               monkeyAnswerChoiceConf.score = 0
            }
            return pushChoiceCol(monkeyAnswerChoiceConf)
         } else {
            return pushEmptyCol()
         }
      } else {
         return pushEmptyCol()
      }
   }

   let questionType = surveyQuestion.monkeyInfo.type

   switch (questionType) {
      case 'OPEN_ENDED_SINGLE':
         if (monkeyAnswer && monkeyAnswer.text) {
            value = monkeyAnswer.text.trim()
            realValue = monkeyAnswer.text.trim()
            score = ''
         } else {
            value = ''
            realValue = ''
            score = ''
         }
         return pushValueCol(value, realValue, score)
      case 'OPEN_ENDED_NUMERICAL':
         if (monkeyAnswer && monkeyAnswer.text) {
            value = parseInt(monkeyAnswer.text.trim())
            realValue = monkeyAnswer.text.trim()
            score = parseInt(monkeyAnswer.text.trim())
         } else {
            value = ''
            realValue = ''
            score = ''
         }
         return pushValueCol(value, realValue, score)
      case 'DATETIME_DATE_ONLY':
         if (monkeyAnswer && monkeyAnswer.text) {
            value = monkeyAnswer.text.trim()
            realValue = monkeyAnswer.text.trim()
            score = ''
         } else {
            value = ''
            realValue = ''
            score = ''
         }
         return pushValueCol(value, realValue, score)
      //break
      case 'SINGLE_CHOICE_MENU':
         return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)

      //break
      case 'SINGLE_CHOICE_VERTICAL':
         return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)
      case 'SINGLE_CHOICE_VERTICAL_THREE_COL':
         return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)

      case 'MATRIX_RATING': //for updating responses from survey monkey
         {
            return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)
         }
         break
      case 'MATRIX_SINGLE': //for updating responses from survey monkey
         {
            return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)
         }
         break
      case 'open_ended_numerical': //for updating responses from survey monkey
         {
            for (
               let rowIndex = 0;
               rowIndex < monkeyQuestionAnswersConf.rows.length;
               rowIndex++
            ) {
               let monkeyRowConf = monkeyQuestionAnswersConf.rows[rowIndex]

               let monkeyResponseAnswer = monkeyResponseAnswers.find(
                  monkeyResponse => monkeyResponse.row_id == monkeyRowConf.id,
               )

               if (HasData(monkeyResponseAnswer)) {
                  let text = monkeyResponseAnswer.text
                  let value = Number.parseInt(text)

                  //when choice is selected, the value, real and score are in the selected choice found in survey config.
                  pushValueCol(value, text, value)
               } else {
                  pushEmptyCol()
               }
            }
         }
         break
      case 'MULTIPLE_CHOICE_VERTICAL_THREE_COL': {
         return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)
      }
      case 'MULTIPLE_CHOICE_VERTICAL': {
         //for updating responses from survey monkey
         return ProcessSingleChoiceAnswer(surveyQuestion, monkeyAnswer)
         //    for (
         //       let choiceIndex = 0;
         //       choiceIndex < monkeyQuestionAnswersConf.choices.length;
         //       choiceIndex++
         //    ) {
         //       let monkeyChoiceConf =
         //          monkeyQuestionAnswersConf.choices[choiceIndex]

         //       let monkeyResponseAnswer = monkeyResponseAnswers?.find(
         //          monkeyResponse =>
         //             monkeyResponse.choice_id == monkeyChoiceConf.id,
         //       )

         //       if (HasData(monkeyResponseAnswer)) {
         //          if (monkeyResponseAnswer['choice_id'] != undefined) {
         //             //when choice is selected, the value, real and score are in the selected choice found in survey config.
         //             pushChoiceCol(monkeyChoiceConf)
         //          } else {
         //             throw Error(
         //                `The choice_id value was not found in the answer as expected: ${j(
         //                   monkeyResponseAnswer,
         //                )}`,
         //             )
         //          }
         //       } else {
         //          //For multiple choice vertical option, if the choice was not selected in the answers, then push en empty column.
         //          pushEmptyCol()
         //       }
         //    }
      }
      // break

      default:
         throw new Error(
            `Family:${monkeyQuestionDetailsConf.family} and subType=${monkeyQuestionDetailsConf.subtype} combination is not valid.`,
         )
   }
   LogThis(log, `cols=${j(cols)}`, L3)
   return cols
}

const GetWeightedResponse = (surveyQuestion, monkeyAnswer) => {
   const log = new LoggerSettings(srcFileName, 'AnalyzeQuestionResponse')
   let weightedResponse = null
   let response = null
   let isWeighted = false
   let answerValue = monkeyAnswer.value
   if (
      surveyQuestion.weights &&
      Object.keys(surveyQuestion.weights).length > 0 &&
      answerValue
   ) {
      switch (surveyQuestion.weightType) {
         case WEIGHTED_PAIRS:
            weightedResponse = Number(surveyQuestion.weights[answerValue])
            isWeighted = true
            break
         case WEIGHTED_CRITERIA:
            try {
               weightedResponse = applyStringCriteriaToValue(
                  surveyQuestion.weights,
                  answerValue,
               )
               weightedResponse = Number(weightedResponse)
               isWeighted = true
            } catch (error) {
               LogThis(log, `error: ${error.message}`, L0)
            }
            break
         default:
            isWeighted = false
      }
      LogThis(
         log,
         `question weights=${JSON.stringify(surveyQuestion.weights)}`,
         L3,
      )
      LogThis(
         log,
         `fieldName=${surveyQuestion.fieldName}; isWeighted=${isWeighted}; answerA=${answerValue}; weightedResponse=${weightedResponse}`,
         L3,
      )
      if (weightedResponse === undefined || weightedResponse === '') {
         weightedResponse = answerValue
         isWeighted = false
      } else {
         isWeighted = true
      }
      //response = answerValue
      //answers[superSurveyQuestionCol] = weightedResponse
      monkeyAnswer.weightedResponse = weightedResponse
      monkeyAnswer.isWeighted = isWeighted
      LogThis(
         log,
         `fieldName=${surveyQuestion.fieldName}; isWeighted=${isWeighted}; answerA=${answerValue}; weightedResponse=${weightedResponse}`,
         L3,
      )
      return monkeyAnswer
   } else {
      //CASE NO_WEIGHTED
      //let answerA = answers[superSurveyQuestionCol]
      // //response = answerA
      // weightedResponse = answerA
      // isWeighted = false

      monkeyAnswer.weightedResponse = monkeyAnswer.value
      monkeyAnswer.isWeighted = false
      LogThis(log, `no weighted: monkeyAnswer=${j(monkeyAnswer)};`, L3)
      return monkeyAnswer
   }
}

// surveyResponses.push({
//    questionId: surveyQuestion._id,
//    respondentId: respondentId,
//    row: row,
//    col: a + 1,
//    response: response,
//    responseReal: answersReal[superSurveyQuestionCol],
//    weightedResponse: weightedResponse,
//    isWeighted: isWeighted,
// })

// if (isWeighted) {
//    LogThis(
//       log,
//       `Adding csv weighted answer: weightedResponse=${weightedResponse}`,
//       L3,
//    )
//    weightedResponse = weightedResponse ?? ''
//    //csv = csv + weightedResponse.toString() + ",";
// } //else {
// //     csv = csv + response.toString() + ",";
// //   }

// LogThis(
//    log,
//    `surveyResponses=${JSON.stringify(surveyResponses, null, 2)}`,
//    L3,
// )

module.exports = {
   getMonkeyResponses,
   ValidateMonkeyConfigs,
   AnalyzeQuestionResponse,
   PushBlankPage,
   AnalyzeQuestionResponseRedesign,
   GetWeightedResponse,
}
