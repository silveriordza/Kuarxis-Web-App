
const { LogManager, L3} = require("./LogManager.js")
const MongoDBManager = require("./MongoDBManager.js")
const TemplateManager = require("./TemplateManager.js")

const {
    cloneObject,
    getCloneObjectExceptionFieldsList,
 } = require('../utils/Functions')

 const {
    getsurveyElementKey,
 } = require('../utils/surveysLib')

 

const QTYPE_OPEN_ENDED_SINGLE = "OPEN_ENDED_SINGLE"
const QTYPE_OPEN_ENDED_NUMERICAL = "OPEN_ENDED_NUMERICAL"
const QTYPE_SINGLE_CHOICE_MENU = "SINGLE_CHOICE_MENU"
const QTYPE_SINGLE_CHOICE_VERTICAL = "SINGLE_CHOICE_VERTICAL"
const QTYPE_SINGLE_CHOICE_VERTICAL_THREE_COL = "SINGLE_CHOICE_VERTICAL_THREE_COL"
const QTYPE_MATRIX_RATING = "MATRIX_RATING"
const QTYPE_MATRIX_SINGLE = "MATRIX_SINGLE"
const QTYPE_MULTIPLE_CHOICE_VERTICAL = "MULTIPLE_CHOICE_VERTICAL"
const QTYPE_MULTIPLE_CHOICE_VERTICAL_THREE_COL = "MULTIPLE_CHOICE_VERTICAL_THREE_COL"
const QTYPE_PRESENTATION_DESCRIPTIVE = "QTYPE_PRESENTATION_DESCRIPTIVE"
const QTYPE_DATETIME_DATE_ONLY = "DATETIME_DATE_ONLY"




const sourceFilename = "SurveyMonkeyIntegratedManager.js"
const collectionName = "SurveyMonkeyIntegrated"
const identifierFieldName = "superSurveyShortName"
const monkeyIdentifierFieldName = "monkeyId"

class SurveyMonkeyIntegratedManager extends TemplateManager {
    constructor(){
        super(collectionName, identifierFieldName)
            this.log = new LogManager (sourceFilename, "constructor")
            this.log.LogThis(`START`, L3)
            this.mongoDBManager = new MongoDBManager(collectionName)
        }

        async save (){
            this.log.setFunctionName('integrateSuperSurvey')
            this.log.LogThis(`save`, L3)
            const superSurveyConfig = this.superSurveyConfigs
            const monkeyConfigs = this.monkeyConfigs
            const config = {}
            config.superSurveyId = superSurveyConfig._id
            config.monkeyId = monkeyConfigs.survey.id
            config.superSurveyShortName = superSurveyConfig.superSurveyShortName
            config.surveyConfigs = superSurveyConfig
            const configs = [config]
            this.configs = configs
            return await super.save() 
        }

        
        async load(identifierValue){
            this.log.setFunctionName("load")
            this.filter = {}
            this.identifierValue = identifierValue
            this.setIdentifierToMonkeyId()

            this.filter[this.identifierFieldName]=identifierValue
            const result = await super.load(this.filter)

            this.setIdentifierBackToNormal()
            return result
        }
        setIdentifierToMonkeyId(){
            this.identifierFieldName = monkeyIdentifierFieldName
        }

        setIdentifierBackToNormal(){
            this.identifierFieldName = identifierFieldName
        }
        
        integrateSuperSurvey(){
            this.log.setFunctionName('integrateSuperSurvey')
            this.log.LogThis(`START`, L3)
                       
            //superSurveyConfig.surveyConfigs = superSurveyConfig
            this.superSurveyConfigs.monkeyInfo = {monkeyId: this.monkeyConfigs.surveyMonkeyId}
            //this.superSurveyConfigs = config
            return this.superSurveyConfigs
        }
       

        mapifySurveyConfigToProcessMonkeyWebhookAnswers(){
            this.log.setFunctionName("mapifySurveyConfig")
            
            this.log.HasDataMultipeEx("this.configs,this.configs.superSurveyConfig", this.configs, this.configs?.superSurveyConfig)

            const superSurveyConfig = this.configs.superSurveyConfig
            
            const superSurveyMap = new Map()
            const surveysMap = new Map()

            // const questionsMap = new Map()
            // const calculatedFieldsMap = new Map()
            // const outputLayoutsMap = new Map()

            const surveysConfigs = superSurveyConfig.surveys

            for (let survey in surveysConfigs){

                let questions = survey.questions
                let questionsMap = new Map()
                for(let question in questions){
                    let questionKey = getsurveyElementKey(question)
                    questionsMap.set(questionKey,question)
                }
                let calculatedFields = survey.calcualtedFields
                let calculatedFieldsMap = new Map()
                for(let calculatedField in calculatedFields ){
                    let calculatedFieldKey = getsurveyElementKey(calculatedField)
                    calculatedFieldsMap.set(calculatedFieldKey, calculatedField)
                }

                survey.questionsMap = questionsMap
                survey.calculatedFieldsMap = calculatedFieldsMap
                surveysMap.set(survey.surveyShortName, survey)
            }
            superSurveyConfig.surveysMap = surveysMap
            superSurveyMap.set(superSurveyConfig.superSurveyShortName, ) 


        }

        integrateSurveys(){
            this.log.setFunctionName('integrateSurveys')
            this.log.LogThis(`START`, L3)
            const superSurveyConfig = this.superSurveyConfigs
            const monkeyConfigs = this.monkeyConfigs

            const surveys = superSurveyConfig.surveys
            const monkeyPages = monkeyConfigs.survey.pages

            const surveysMap = new Map()
            const monkeyPagesMap = new Map()
            
            for(const survey of surveys) {
                if(survey.surveyShortName === "INFO"){
                    continue
                }
                surveysMap.set(survey.monkeyInfo.position, survey)
            }

            monkeyPages.forEach(page => {
                monkeyPagesMap.set(page.position, page)
            })

           
            for(const [position, survey] of surveysMap){
                let monkeyPage = monkeyPagesMap.get(position)

                if(this.log.HasData(monkeyPage)){ 
                survey.monkeyInfo.id=monkeyPage.id
                survey.title = monkeyPage.title
                survey.description = monkeyPage.description
            } else{
                survey.monkeyInfo.id=null
                survey.title = null
                survey.description = null
            }
            }
            this.surveysMap = surveysMap
            this.monkeyPagesMap = monkeyPagesMap

            return this.superSurveyConfigs
        }

        determineQuestionList(question){
            this.log.setFunctionName('determineQuestionList')
            this.log.LogThis(`START`, L3)
            const questionFamilyType = `${question.details.family}-${question.details.subtype}`.toLocaleLowerCase
            
            switch(questionFamilyType){
                case "open_ended-single":
                    return question;
                case "open_ended-single_choice":
                    return question;
                case "single_choice-menu":
                    if(question.details.answers.hasOwnProperty("other")){
                        return question.details.answers.other
                    }
                    return question;
                case "":
                    return question

            }
        }

        getQuestionType(question){
            this.log.setFunctionName('getQuestionType')
            this.log.LogThis(`START`, L3)
            return `${question.details.family}_${question.details.subtype}`.toUpperCase()
        }
        
        
        getIndex(page, question, other=null){
            let index = null

            const questionType = this.getQuestionType(question)

            if( questionType === QTYPE_OPEN_ENDED_SINGLE ||
                questionType===QTYPE_SINGLE_CHOICE_MENU||
                questionType===QTYPE_PRESENTATION_DESCRIPTIVE||
                questionType===QTYPE_SINGLE_CHOICE_VERTICAL
                 ){
                return `${page.position}.${question.position}.${question.details.position}`

            } else 
            if (questionType===QTYPE_MATRIX_RATING ||
                questionType===QTYPE_MATRIX_SINGLE ||
                questionType===QTYPE_MULTIPLE_CHOICE_VERTICAL){
                this.log.HasDataException(row, `row data missing`)
                return `${page.position}.${question.position}.${other.position}`
            } 
        }

        pushQuestionToMap(mapObject, object, other=null){
            this.log.setFunctionName('pushQuestionToMap')
            this.log.LogThis(`START`, L3)

            questionsMap.set(getIndex(page, question), question)
        }

        getAnswerScore (answerChoice){
            this.log.setFunctionName('getAnswerScore')
            this.log.LogThis(`START`, L3)
            if(answerChoice.hasOwnProperty("weight")){
                return answerChoice.weight
            } else if (answerChoice.hasOwnProperty("quiz_options")){
                return answerChoice.quiz_options.score
            } else {
                return 0
            }
        }
        mapAnswerChoice(question, answerField, answerChoices){
            this.log.setFunctionName('mapAnswerChoice')
            this.log.LogThis(`START`, L3)
            question.monkeyInfo.monkeyAnswers = {
                answerField: answerField,
                answerChoices: answerChoices.map(choice => ({id: choice.id, value: choice.position, realValue: choice.text, score: this.getAnswerScore(choice)})),
            }   
        }

        mapQuestionToMonkey(surveyQuestion, monkeyQuestions){
            this.log.setFunctionName('mapQuestionToMonkey')
            this.log.LogThis(`START`, L3)
            let monkeyQuestion = monkeyQuestions[surveyQuestion.monkeyInfo.position-1]

            const questionType = this.getQuestionType(monkeyQuestion) 
            surveyQuestion.question = monkeyQuestion.heading
            surveyQuestion.monkeyInfo.id = monkeyQuestion.id

            surveyQuestion.monkeyInfo.id = monkeyQuestion.details.id
            surveyQuestion.monkeyInfo.type = questionType
            surveyQuestion.monkeyInfo.family = monkeyQuestion.details.family
            surveyQuestion.monkeyInfo.subtype = monkeyQuestion.details.subtype
            
            if( questionType===QTYPE_OPEN_ENDED_SINGLE)
            {
                surveyQuestion.monkeyInfo.monkeyAnswers = {
                    answerField: 'text',
                    answerChoices: null,
                    value: monkeyQuestion.details.position,
                    score: null
                }   
            }
            else if (questionType===QTYPE_OPEN_ENDED_NUMERICAL){
                let monkeyAnswer = monkeyQuestion.details.answers.rows[surveyQuestion.monkeyInfo.subPosition-1]
                surveyQuestion.question = monkeyAnswer.text
                surveyQuestion.monkeyInfo.id = monkeyAnswer.id
                surveyQuestion.monkeyInfo.monkeyAnswers = {
                    answerField: 'text',
                    answerChoices: null,
                    value: monkeyQuestion.details.position,
                    score: null
                }   
            }
            else if (questionType===QTYPE_DATETIME_DATE_ONLY){
                let monkeyAnswer = monkeyQuestion.details.answers.rows[0]
                surveyQuestion.question = monkeyAnswer.text
                surveyQuestion.monkeyInfo.id = monkeyAnswer.id
                surveyQuestion.monkeyInfo.monkeyAnswers = {
                    answerField: 'text',
                    answerChoices: null,
                    value: monkeyQuestion.details.position,
                    score: null
                }   
            }
            else if(questionType===QTYPE_SINGLE_CHOICE_MENU || questionType === QTYPE_SINGLE_CHOICE_VERTICAL || questionType === QTYPE_SINGLE_CHOICE_VERTICAL_THREE_COL) {

                if(surveyQuestion.monkeyInfo.answerType=="noother"){
                    
                    this.mapAnswerChoice(surveyQuestion, 'choice_id', monkeyQuestion.details.answers.choices)
                    
                } else if(surveyQuestion.monkeyInfo.answerType=="other"){
                   
                    this.mapAnswerChoice(surveyQuestion, 'other_id', [monkeyQuestion.details.answers.other])                   
                }
                
            } else if(questionType===QTYPE_PRESENTATION_DESCRIPTIVE) {

                surveyQuestion.monkeyInfo.monkeyAnswers = {
                    answerField: null,
                    answerChoices: null,
                    value: null,
                    score: null
                }   

            } else 
            if (
                questionType===QTYPE_MATRIX_RATING ||
                questionType===QTYPE_MATRIX_SINGLE
            ) {
                let monkeyAnswer = monkeyQuestion.details.answers.rows[surveyQuestion.monkeyInfo.subPosition-1]
                surveyQuestion.question = monkeyAnswer.text
                surveyQuestion.monkeyInfo.id = monkeyAnswer.id
                this.mapAnswerChoice(surveyQuestion, 'choice_id', monkeyQuestion.details.answers.choices)
                   
            } else if (questionType===QTYPE_MULTIPLE_CHOICE_VERTICAL || questionType===QTYPE_MULTIPLE_CHOICE_VERTICAL_THREE_COL){
                let monkeyAnswer = monkeyQuestion.details.answers.choices[surveyQuestion.monkeyInfo.subPosition-1]
                surveyQuestion.question = monkeyAnswer.text
                surveyQuestion.monkeyInfo.id = monkeyQuestion.details.id
                this.mapAnswerChoice(surveyQuestion, 'choice_id', [monkeyAnswer])
            } else {
                throw Error(`SurveyMonkeyIntegrated: mapQuestiontoMonkey FATAL ERROR: missing logic to process this questionType for object: ${this.log.j(surveyQuestion)}`)
            }

        }
 
        

        integrateQuestions(){
            this.log.setFunctionName('integrateQuestions')
            this.log.LogThis(`START`, L3)
            const surveysMap = this.surveysMap
            const monkeyPagesMap = this.monkeyPagesMap
            
            for (const [surveyKey, surveyPage] of surveysMap){
                if (surveyPage.surveyShortName === "INFO"){
                    continue
                }
                let monkeyPage = monkeyPagesMap.get(surveyPage.monkeyInfo.position)
                let surveyQuestions = surveyPage.questions
                let monkeyQuestions = monkeyPage.questions
                for (const surveyQuestion of surveyQuestions){
                    this.log.LogThis(`Mapping question ${surveyQuestion.fieldName}`, L3)
                    this.mapQuestionToMonkey(surveyQuestion, monkeyQuestions)                    
                }
            }

            return this.superSurveyConfigs
        }
        
        async integrateConfigs(superSurveyConfigs, monkeyConfigs){
            this.log.setFunctionName('integrateQuestions')
            this.log.LogThis(`START`, L3)
            this.superSurveyConfigs = superSurveyConfigs[0]
            this.monkeyConfigs = monkeyConfigs
            this.integrateSuperSurvey() 
            this.integrateSurveys()
            this.integrateQuestions()

            return await this.save()
        }

       
    }

    

module.exports = SurveyMonkeyIntegratedManager