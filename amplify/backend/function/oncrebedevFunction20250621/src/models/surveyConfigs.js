/**
 * @prettier
 */

function superSurveyConfig(owner, surveyName, surveyShortName, description) {
   this.owner = owner || ''
   this.surveyName = surveyName || ''
   this.surveyShortName = surveyShortName || ''
   this.description = description || ''
}

function surveyConfig(
   owner,
   SurveyName,
   SurveyShortName,
   description,
   instructions,
) {
   this.owner = owner || ''
   this.SurveyName = SurveyName || ''
   this.SurveyShortName = SurveyShortName || ''
   this.description = description || ''
   this.instructions = instructions || ''
}

function questionConfig(
   surveyId,
   question,
   questionShortDescription,
   fieldName,
   subScale,
   position,
) {
   this.surveyId = surveyId || ''
   this.question = question || ''
   this.questionShortDescription = questionShortDescription || ''
   this.fieldName = fieldName || ''
   this.subScale = subScale || -1
   this.position = position || -1
}

function multiSurveyConfig(owner, superSurveyId, surveyId, surveySequence) {
   this.owner = owner || ''
   this.superSurveyId = superSurveyId || ''
   this.surveyId = surveyId || ''
   this.surveySequence = surveySequence || -1
}

function superSurveyCollectedConfig(
   superSurveyId,
   respondentId,
   collectorId,
   dateCreated,
   dateModified,
   ipAddress,
   emailAddress,
   firstName,
   lastName,
   custom1,
) {
   this.superSurveyId = superSurveyId || ''
   this.respondentId = respondentId || -1
   this.collectorId = collectorId || -1
   this.dateCreated = dateCreated || Date.now()
   this.dateModified = dateModified || Date.now()
   this.ipAddress = ipAddress || ''
   this.emailAddress = emailAddress || ''
   this.firstName = firstName || ''
   this.lastName = lastName || ''
   this.custom1 = custom1 || ''
}

function surveyResponseConfig(positionlectedId, questionId, response) {
   this.positionlectedId = surveyName || ''
   this.questionId = surveyName || ''
   this.response = surveyName || ''
}

module.exports = {
   superSurveyConfig,
   surveyConfig,
   multiSurveyConfig,
   questionConfig,
   superSurveyCollectedConfig,
   surveyResponseConfig,
}
