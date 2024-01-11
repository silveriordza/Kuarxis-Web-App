const TemplateManager = require("./TemplateManager")
let {
    Survey,
 } = require('../models/surveysModel.js')

class SurveyManager extends TemplateManager {
    constructor(template, owner){
        super(
            template,
            owner,
            )
    }

    //Updates the namesList in the parent TemplateMangaer based on specific function for the type of template.
    getTemplatesNamesList = () => {
        this.namesList = this.template.map(survey => (survey.surveyShortName))
        return this.namesList
    }
    //deleteAllExistentTemplates is implemented in the parent class TemplateManager, no override required.

    
}

module.exports = SurveyManager